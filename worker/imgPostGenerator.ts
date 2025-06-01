import { isPromptDef, PromptDef } from "./prompt";
import { ImageGenClient } from "../lib/imageGenClient";
import { randomUUID } from "crypto";
import { IImageRepository } from "../lib/repositories/imageRepository";
import { MIMEType } from "util";
import { BaseAIPostGenerator, PostContents } from "./baseAIPostGenerator";
import { CreatePostRecord } from "@/lib/repositories/postRepository";

interface ImageGeneratorConfig {
    numPosts: number;
    prompt: PromptDef;
    negative_prompt?: string;
    steps?: number;
    guidance_scale?: number;
    include_prompt_in_post?: boolean;
}

export function isImageGeneratorConfig(x: unknown): x is ImageGeneratorConfig {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;

    // numPosts: required number
    if (typeof obj.numPosts !== "number") return false;

    // prompt: required PromptDef
    if (!("prompt" in obj)) return false;
    if (!isPromptDef(obj.prompt)) return false;

    // optional temperature: must be number if present
    if ("temperature" in obj) {
        const t = obj.temperature;
        if (t !== undefined && typeof t !== "number") return false;
    }

    // optional negative_prompt: must be string if present
    if ("negative_prompt" in obj) {
        const np = obj.negative_prompt;
        if (np !== undefined && typeof np !== "string") return false;
    }

    // optional steps: must be number if present
    if ("steps" in obj) {
        const s = obj.steps;
        if (s !== undefined && typeof s !== "number") return false;
    }

    // optional guidance_scale: must be number if present
    if ("guidance_scale" in obj) {
        const gs = obj.guidance_scale;
        if (gs !== undefined && typeof gs !== "number") return false;
    }

    return true;
}

const MODEL_NAME = process.env.IMG_GEN_MODEL ?? "sd3.5";

export class ImagePostGenerator extends BaseAIPostGenerator<ImageGeneratorConfig> {
    private client: ImageGenClient;
    private imgRepo: IImageRepository;

    constructor(genClient: ImageGenClient, imageRepo: IImageRepository) {
        super();
        this.client = genClient;
        this.imgRepo = imageRepo;
    }

    public async generatePosts(
        id: number,
        name: string,
        rawConfig: unknown,
    ): Promise<CreatePostRecord[]> {
        console.log("checking for image generator health")
        for(let i = 0; i < 20; ++i) {
            let health = null;
            try {
                health = await this.client.getHealth();
            } catch(e) {
                continue;
            }
            console.log("got health check result", health);
            if(health.status == "ok") {
                return super.generatePosts(id, name, rawConfig);
            }
        }
        throw new Error("image generator service failed to health check after 20 attempts");
    }

    protected validateConfig(config: unknown): config is ImageGeneratorConfig {
        return isImageGeneratorConfig(config);
    }

    protected async generatePost(
        config: ImageGeneratorConfig,
        prompt: string,
    ): Promise<PostContents> {
        const filename = `${randomUUID()}.jpg`;
        const imageUrl = `/api/images/${filename}`;

        const imageStream = await this.client.generate({
            model: MODEL_NAME,
            prompt,
            negative_prompt: config.negative_prompt,
            guidance_scale: config.guidance_scale,
            steps: config.steps,
            output_format: "jpg",
        });

        await this.imgRepo.put(
            filename,
            new MIMEType("image/jpg"),
            imageStream,
        );

        return {
            imageUrl,
            body: config.include_prompt_in_post ? prompt : undefined,
        };
    }
}
