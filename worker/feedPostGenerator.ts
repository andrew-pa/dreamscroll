import { PostGenerator } from "./postGenerator";
import { CreatePostRecord } from "@/lib/repositories/postRepository";
import { getGeneratorRepository } from "@/lib/repositories";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

interface FeedGeneratorConfig {
    listUrl: string;
    articleBaseUrl: string;
}

interface FeedItem {
    id: string;
    url: string;
    published: string;
    title: string;
}

interface TweetData {
    body: string;
    image_url?: string;
}

interface AIResponse {
    tweets: TweetData[];
}

const MODEL_NAME = process.env.TEXT_GEN_MODEL ?? "gemma3:27b";

export class FeedPostGenerator extends PostGenerator {
    private client = new OpenAI();
    private turndown = new TurndownService();

    private isConfig(x: unknown): x is FeedGeneratorConfig {
        return (
            typeof x === "object" &&
            x !== null &&
            typeof (x as Record<string, unknown>).listUrl === "string" &&
            typeof (x as Record<string, unknown>).articleBaseUrl === "string"
        );
    }

    public async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
    ): Promise<CreatePostRecord[]> {
        if (!this.isConfig(rawConfig)) {
            throw new Error(
                "configuration invalid: " + JSON.stringify(rawConfig),
            );
        }
        const config = rawConfig as FeedGeneratorConfig;
        const repo = getGeneratorRepository();
        const self = (await repo.list()).find(g => g.id === id);
        const since = self?.lastRun ?? new Date(0);

        const url = new URL(config.listUrl);
        url.searchParams.set("since", since.toISOString());
        const items: FeedItem[] = await fetch(url).then(r => {
            if (!r.ok) throw new Error(`failed to fetch list: ${r.status}`);
            return r.json();
        });

        const posts: CreatePostRecord[] = [];
        for (const item of items) {
            const tweets = await this.genTweets(item);
            const base = new Date(item.published);
            for (let i = 0; i < tweets.length; i++) {
                const tw = tweets[i];
                posts.push({
                    generatorId: id,
                    generatorName: name,
                    body: tw.body,
                    imageUrl: tw.image_url,
                    moreLink: `${config.articleBaseUrl.replace(/\/?$/, "")}/${item.id}`,
                    timestamp: new Date(base.getTime() + i * 2 * 60 * 1000),
                });
            }
        }
        return posts;
    }

    private async genTweets(item: FeedItem): Promise<TweetData[]> {
        const html = await fetch(item.url).then(r => r.text());
        const dom = new JSDOM(html, { url: item.url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        const markdown = this.turndown.turndown(article?.content ?? "");

        const schema = {
            type: "object",
            properties: {
                tweets: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            body: { type: "string" },
                            image_url: { type: "string", format: "uri" },
                        },
                        required: ["body"],
                    },
                    minItems: 3,
                    maxItems: 7,
                },
            },
            required: ["tweets"],
        } as const;

        const prompt = `Turn the following article into 3-7 interesting tweets that encourage reading it. Output JSON matching this schema: ${JSON.stringify(
            schema,
        )}\n\n${markdown}`;

        const resp = await this.client.chat.completions.create({
            model: MODEL_NAME,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that only replies with valid JSON.",
                },
                { role: "user", content: prompt },
            ],
        });

        const text = resp.choices[0]?.message.content ?? "{}";
        let parsed: AIResponse;
        try {
            parsed = JSON.parse(text);
        } catch {
            return [];
        }
        return parsed.tweets ?? [];
    }
}
