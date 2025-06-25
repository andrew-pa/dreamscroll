import { CreatePostRecord } from "../lib/repositories/postRepository";
import { PostGenerator } from "./postGenerator";
import { Prompt, PromptDef } from "./prompt";

export interface BaseAIPostGeneratorConfig {
    numPosts: number;
    prompt: PromptDef;
}

export interface PostContents {
    imageUrl?: string;
    body?: string;
}

// 4 hours
const POST_TIME_SPREAD = 4 * 3600 * 1000;

export abstract class BaseAIPostGenerator<
    TConfig extends BaseAIPostGeneratorConfig,
> extends PostGenerator {
    public async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
        lastRun: Date | null,
    ): Promise<CreatePostRecord[]> {
        if (!this.validateConfig(rawConfig)) {
            throw new Error(
                "configuration invalid: " + JSON.stringify(rawConfig),
            );
        }

        const config = rawConfig as TConfig;

        if (config.numPosts == 0) {
            return [];
        }

        const prompts = await new Prompt(config.prompt).sample(config.numPosts);

        const posts = [];

        for (const p of prompts) {
            try {
                const { imageUrl, body } = await this.generatePost(config, p);
                posts.push({
                    generatorId: id,
                    generatorName: name,
                    timestamp: new Date(
                        Date.now() + Math.random() * POST_TIME_SPREAD,
                    ),
                    imageUrl,
                    body,
                });
            } catch (e) {
                console.log("failed to generate post", e);
            }
        }

        return posts;
    }

    protected abstract validateConfig(config: unknown): config is TConfig;
    protected abstract generatePost(
        config: TConfig,
        prompt: string,
    ): Promise<PostContents>;
}
