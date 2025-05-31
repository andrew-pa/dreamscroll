import { CreatePostRecord } from "../lib/repositories/postRepository";
import { PostGenerator } from ".";
import { isPromptDef, Prompt, PromptDef } from "./prompt";
import { ImageGenClient } from "../lib/imageGenClient";
import { randomUUID } from "crypto";
import { IImageRepository } from "../lib/repositories/imageRepository";
import { MIMEType } from "util";

interface ImageGeneratorConfig {
    numPosts: number;
    prompt: PromptDef;
    negative_prompt?: string;
    steps?: number;
    guidance_scale?: number;
    include_prompt_in_post?: boolean;
}

export function isImageGeneratorConfig(x: unknown): x is ImageGeneratorConfig {
  if (typeof x !== 'object' || x === null) return false;
  const obj = x as Record<string, unknown>;

  // numPosts: required number
  if (typeof obj.numPosts !== 'number') return false;

  // prompt: required PromptDef
  if (!('prompt' in obj)) return false;
  if (!isPromptDef(obj.prompt)) return false;

  // optional temperature: must be number if present
  if ('temperature' in obj) {
    const t = obj.temperature;
    if (t !== undefined && typeof t !== 'number') return false;
  }

  // optional negative_prompt: must be string if present
  if ('negative_prompt' in obj) {
    const np = obj.negative_prompt;
    if (np !== undefined && typeof np !== 'string') return false;
  }

  // optional steps: must be number if present
  if ('steps' in obj) {
    const s = obj.steps;
    if (s !== undefined && typeof s !== 'number') return false;
  }

  // optional guidance_scale: must be number if present
  if ('guidance_scale' in obj) {
    const gs = obj.guidance_scale;
    if (gs !== undefined && typeof gs !== 'number') return false;
  }

  return true;
}

const MODEL_NAME = process.env.IMG_GEN_MODEL ?? "sd3.5";

export class PicturePostGenerator implements PostGenerator {
    private client: ImageGenClient;
    private imgRepo: IImageRepository;

    constructor(genClient: ImageGenClient, imageRepo: IImageRepository) {
        this.client = genClient;
        this.imgRepo = imageRepo;
    }

    async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
    ): Promise<CreatePostRecord[]> {
        if (!isImageGeneratorConfig(rawConfig)) {
            throw new Error(
                "configuration invalid: " + JSON.stringify(rawConfig),
            );
        }

        const config = rawConfig as ImageGeneratorConfig;

        const prompts = await new Prompt(config.prompt).sample(config.numPosts);

        return await Promise.all(
            prompts.map(p => this.generatePost(id, name, config, p)),
        );
    }

    async generatePost(
        id: number,
        name: string,
        config: ImageGeneratorConfig,
        prompt: string,
    ): Promise<CreatePostRecord> {
        const filename = `${randomUUID()}.jpg`;
        const imageUrl = `/api/images/${filename}`;

        const imageStream = await this.client.generate({
            model: MODEL_NAME,
            prompt,
            negative_prompt: config.negative_prompt,
            guidance_scale: config.guidance_scale,
            steps: config.steps,
            output_format: 'jpg'
        });

        await this.imgRepo.put(filename, new MIMEType("image/jpg"), imageStream);

        return {
            generatorId: id,
            generatorName: name,
            timestamp: new Date(),
            imageUrl,
            body: config.include_prompt_in_post ? prompt : undefined,
        };
    }
}
