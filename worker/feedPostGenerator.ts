import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import got from "got";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { z } from "zod";

import { PostGenerator } from "./postGenerator";
import { CreatePostRecord } from "@/lib/repositories/postRepository";

interface FeedItem {
    id: string;
    url: string;
    published: string;
    feedName: string;
}

interface FeedPostGeneratorConfig {
    /** URL that lists new items. `after` (ISO timestamp) will be appended. */
    sourceUrl: string;
    /** Base URL used to build the more-link for each post */
    itemUrlBase: string;
}

export function isFeedPostGeneratorConfig(
    x: unknown,
): x is FeedPostGeneratorConfig {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;
    return (
        typeof obj.sourceUrl === "string" &&
        typeof obj.itemUrlBase === "string"
    );
}

const MODEL_NAME = process.env.TEXT_GEN_MODEL ?? "gemma3:27b";
const SYSTEM_MESSAGE = `
Given the article provided by the user, write 1 to 3 engaging tweets that would get people interested in reading the article (ie clicking the link to it).
Avoid clickbait and aim to make substantive, interesting posts.
Your output must follow the provided JSON schema.
You do not need to link to the article in your post contents, do *not* include "[link here]" or similar.
Do not include any hashtags.
Only include an image if it is present in the original article and is relevant to the exact post. You must provide the full URL to the image exactly as it is provided to you. Images are *not necessary* so if there isn't one do not include a URL and just set it to null.
`.trim();

const turndown = new TurndownService();

export class FeedPostGenerator extends PostGenerator {
    private client = new OpenAI();

    public async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
        lastRun: Date | null,
    ): Promise<CreatePostRecord[]> {
        if (!isFeedPostGeneratorConfig(rawConfig)) {
            throw new Error("invalid config for FeedPostGenerator");
        }

        const config = rawConfig as FeedPostGeneratorConfig;

        const since = (lastRun ?? new Date(Date.now() - 3 * 24 * 3600 * 1000)).toISOString();
        const url = new URL(config.sourceUrl);
        url.searchParams.set("after", since);
        const items = (await got(url).json()) as FeedItem[];

        const posts: CreatePostRecord[] = [];
        for (const item of items) {
            try {
                const article = await this.fetchArticleMarkdown(item.url);
                if(article.indexOf("paid subscribers") >= 0) {
                    continue;
                }
                const articlePosts = await this.summarize(article);
                const baseTime = new Date(item.published).getTime();
                articlePosts.forEach((t, idx) => {
                    posts.push({
                        generatorId: id,
                        generatorName: item.feedName.length > 0 ? item.feedName : name,
                        timestamp: new Date(baseTime + idx * 6_000),
                        imageUrl: t.imageUrl?.length == 0 || t.imageUrl == "null" ? null : t.imageUrl,
                        body: t.text,
                        moreLink: new URL(
                            item.id,
                            config.itemUrlBase,
                        ).toString(),
                    });
                });
            } catch (e) {
                console.log("failed to process item", item, e);
            }
        }
        return posts;
    }

    private async fetchArticleMarkdown(url: string): Promise<string> {
        const res = await got(url).text();
        const dom = new JSDOM(res, { url });
        const article = new Readability(dom.window.document).parse();
        const html = article?.content ?? dom.window.document.body.innerHTML;
        return turndown.turndown(html);
    }

    private async summarize(
        markdown: string,
    ): Promise<{ text: string; imageUrl?: string | null }[]> {
        const schema = z.object({
            posts: z
                .array(
                    z.object({
                        text: z.string(),
                        imageUrl: z.string().nullable(),
                    }),
                )
        });

        const completion = await this.client.beta.chat.completions.parse({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                {
                    role: "user",
                    content: markdown,
                },
            ],
            response_format: zodResponseFormat(schema, "posts"),
        });

        const parsed = completion.choices[0].message.parsed ?? {
            posts: [],
        };
        return parsed.posts.slice(0,3);
    }
}
