import { CreatePostRecord } from "../lib/repositories/postRepository";
import { PostGenerator } from ".";
import { isPromptDef, Prompt, PromptDef } from "./prompt";
import OpenAI from "openai";

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

export class TextPostGenerator implements PostGenerator {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI();
    }

    async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
    ): Promise<CreatePostRecord[]> {
        if (!isTextGeneratorConfig(rawConfig)) {
            throw new Error(
                "configuration invalid: " + JSON.stringify(rawConfig),
            );
        }

        const config = rawConfig as TextGeneratorConfig;

        const prompts = await new Prompt(config.prompt).sample(config.numPosts);

        return await Promise.all(
            prompts.map(p => this.generatePost(id, name, config, p)),
        );
    }

    async generatePost(
        id: number,
        name: string,
        config: TextGeneratorConfig,
        prompt: string,
    ): Promise<CreatePostRecord> {
        console.log(prompt);

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

        console.log(body);

        return {
            generatorId: id,
            generatorName: name,
            timestamp: new Date(),
            body,
        };
    }
}
