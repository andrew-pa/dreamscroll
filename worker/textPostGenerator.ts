import { isPromptDef, PromptDef } from "./prompt";
import OpenAI from "openai";
import { BaseAIPostGenerator, PostContents } from "./baseAIPostGenerator";

interface TextGeneratorConfig {
    numPosts: number;
    temperature?: number;
    prompt: PromptDef;
}

/** Returns true if `x` is a TextGeneratorConfig */
export function isTextGeneratorConfig(x: unknown): x is TextGeneratorConfig {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;

    if (!("numPosts" in obj) || typeof obj.numPosts !== "number") return false;

    // must have prompt that is a valid PromptDef
    if (!("prompt" in obj)) return false;
    if (!isPromptDef(obj.prompt)) return false;

    // optional temperature must be a number if present
    if ("temperature" in obj) {
        const t = obj.temperature;
        if (t !== undefined && typeof t !== "number") return false;
    }

    return true;
}

const SYSTEM_MESSAGE =
    "Given the user's instructions, write a post for a modern social media website that is interesting and engaging. Follow their instructions exactly. Your answer should be the exact contents of the post (in Markdown format). Do not include any hashtags.";

const MODEL_NAME = process.env.TEXT_GEN_MODEL ?? "gemma3:27b";

export class TextPostGenerator extends BaseAIPostGenerator<TextGeneratorConfig> {
    private client: OpenAI;

    constructor() {
        super();
        this.client = new OpenAI();
    }

    protected validateConfig(config: unknown): config is TextGeneratorConfig {
        return isTextGeneratorConfig(config);
    }

    protected async generatePost(
        config: TextGeneratorConfig,
        prompt: string,
    ): Promise<PostContents> {
        const resp = await this.client.chat.completions.create({
            model: MODEL_NAME,
            temperature: config.temperature,
            messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                { role: "user", content: prompt },
            ],
        });

        const body = (
            resp.choices.at(0)?.message.content ??
            "no content returned from API!"
        ).trim();

        return { body };
    }

    public async cleanup(): Promise<void> {
        // HACK: tell ollama to unload because we know we are cheapskates but also don't have enough vRAM to load everything at once. We should do this properly but speed is key.
        const url = new URL(this.client.baseURL);
        url.pathname = "/api/generate";
        console.log("unloading ollama @ ", url);
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: "",
                keep_alive: 0,
            }),
        });
        console.log("ollama unload response:", res.status);
    }
}
