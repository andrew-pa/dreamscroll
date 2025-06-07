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
    feed: string;
}

interface RssTweetGeneratorConfig {
    /** URL that lists new items. `since` (ISO timestamp) will be appended. */
    updatesUrl: string;
    /** Base URL used to build the more-link for each post */
    itemUrlBase: string;
}

export function isRssTweetGeneratorConfig(
    x: unknown,
): x is RssTweetGeneratorConfig {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;
    return (
        typeof obj.updatesUrl === "string" &&
        typeof obj.itemUrlBase === "string"
    );
}

const MODEL_NAME = process.env.TEXT_GEN_MODEL ?? "gpt-3.5-turbo";
const SYSTEM_MESSAGE =
    "You turn articles into short tweet threads that make people want to read the full story.";

const turndown = new TurndownService();

export class RssTweetGenerator extends PostGenerator {
    private client = new OpenAI();

    public async generatePosts(
        id: number,
        _name: string,
        rawConfig: unknown,
        lastRun: Date | null,
    ): Promise<CreatePostRecord[]> {
        if (!isRssTweetGeneratorConfig(rawConfig)) {
            throw new Error("invalid config for RssTweetGenerator");
        }
        const config = rawConfig as RssTweetGeneratorConfig;
        const since = (lastRun ?? new Date(0)).toISOString();
        const url = new URL(config.updatesUrl);
        url.searchParams.set("since", since);
        const items = (await got(url).json()) as FeedItem[];

        const posts: CreatePostRecord[] = [];
        for (const item of items) {
            try {
                const article = await this.fetchArticleMarkdown(item.url);
                const tweets = await this.summarize(article);
                const baseTime = new Date(item.published).getTime();
                tweets.forEach((t, idx) => {
                    posts.push({
                        generatorId: id,
                        generatorName: item.feed,
                        timestamp: new Date(baseTime + idx * 2 * 60_000),
                        imageUrl: t.imageUrl,
                        body: t.text,
                        moreLink: new URL(
                            item.id,
                            config.itemUrlBase,
                        ).toString(),
                    });
                });
            } catch (e) {
                console.log("failed to process item", item.id, e);
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
    ): Promise<{ text: string; imageUrl?: string }[]> {
        const schema = z.object({
            tweets: z
                .array(
                    z.object({
                        text: z.string(),
                        imageUrl: z.string().url().optional(),
                    }),
                )
                .min(3)
                .max(7),
        });

        const completion = await this.client.beta.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                {
                    role: "user",
                    content: `Create engaging tweets from the article below.\n\n${markdown}`,
                },
            ],
            response_format: zodResponseFormat(schema, "tweets"),
        });

        const parsed = completion.choices[0].message.parsed ?? {
            tweets: [],
        };
        return parsed.tweets;
    }
}
