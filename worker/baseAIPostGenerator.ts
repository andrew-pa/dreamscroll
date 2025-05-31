import { CreatePostRecord } from "../lib/repositories/postRepository";
import { PostGenerator } from ".";
import { Prompt, PromptDef } from "./prompt";

export interface BaseAIPostGeneratorConfig {
    numPosts: number;
    prompt: PromptDef
}

export interface PostContents {
    imageUrl?: string;
    body?: string;
}

export abstract class BaseAIPostGenerator<TConfig extends BaseAIPostGeneratorConfig> implements PostGenerator {
    async generatePosts(id: number, name: string, rawConfig: unknown): Promise<CreatePostRecord[]> {
        if (!this.validateConfig(rawConfig)) {
            throw new Error(
                "configuration invalid: " + JSON.stringify(rawConfig),
            );
        }

        const config = rawConfig as TConfig;

        const prompts = await new Prompt(config.prompt).sample(config.numPosts);

        return (await Promise.all(
            prompts.map(p => this.generatePost(config, p)),
        )).map(({ imageUrl, body }: PostContents) => ({
                generatorId: id,
                generatorName: name,
                timestamp: new Date(),
                imageUrl,
                body
            }));
    }

    protected abstract validateConfig(config: unknown): config is TConfig;
    protected abstract generatePost(config: TConfig, prompt: string): Promise<PostContents>;
}


