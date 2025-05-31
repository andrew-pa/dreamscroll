/**
 * A TypeScript client library for the Stable Diffusion REST API.
 * - Streams the image bytes so you can pipe them anywhere.
 * - Retries on network/5xx with exponential backoff.
 * - Default 5-minute timeout, configurable per-instance.
 */

import got, { HTTPError } from "got";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";

export interface ImageGenerateParams {
    /** Matches the server’s `single_models` keys */
    model: string;
    prompt: string;
    negative_prompt?: string;
    guidance_scale?: number;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
    output_format?: "jpg" | "png";
}

export interface HealthResponse {
    status: string;
    models_loaded: Record<string, boolean>;
    concurrency: { max: number; active: number };
}

export interface ClientOptions {
    /** E.g. 'http://localhost:8000' */
    baseUrl?: string;
    /** How long to wait before aborting (ms). Default 300 000 (5 min). */
    timeoutMs?: number;
    /** How many times to retry on transient errors. Default 3. */
    retries?: number;
}

export class ImageGenClient {
    private client: typeof got;
    private timeoutMs: number;

    constructor({
        baseUrl = process.env.IMAGE_GEN_BASE_URL ?? "http://localhost:3333",
        timeoutMs = 300_000,
        retries = 5,
    }: ClientOptions = {}) {
        this.timeoutMs = timeoutMs;
        this.client = got.extend({
            prefixUrl: baseUrl,
            responseType: "json",
            timeout: { request: timeoutMs },
            retry: {
                limit: retries,
                methods: ["POST", "GET"],
                statusCodes: [408, 413, 429, 500, 502, 503, 504],
                calculateDelay: ({ attemptCount }) =>
                    Math.min(2 ** attemptCount * 1000, 30_000),
            },
            hooks: {
                beforeRetry: [
                    (error, retryCount) => {
                        console.warn(
                            `Retry ${retryCount} for ${error.options.method} ${error.options.url}: ${error.message}`,
                        );
                    },
                ],
            },
        });
    }

    /** Ping `/health` for models-loaded & concurrency info. */
    async getHealth(): Promise<HealthResponse> {
        const res = await this.client.get("health");
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new HTTPError(res);
        }
        return JSON.parse(res.body) as HealthResponse;
    }

    /**
     * POST `/generate` → Readable stream of raw image bytes.
     * Rejects if HTTP status is non-2xx.
     */
    async generate(params: ImageGenerateParams): Promise<Readable> {
        const stream = this.client.stream("generate", {
            method: "POST",
            json: params,
            headers: { "content-type": "application/json" },
            timeout: { request: this.timeoutMs },
        });

        stream.on("response", response => {
            if (response.statusCode! < 200 || response.statusCode! >= 300) {
                stream.destroy(new HTTPError(response));
            }
        });

        return stream;
    }

    /**
     * Convenience: generate and save directly to a file.
     * ```
     * await client.generateToFile(
     *   { model:'sd3.5', prompt:'...'},
     *   './out.jpg'
     * );
     * ```
     */
    async generateToFile(
        params: ImageGenerateParams,
        filePath: string,
    ): Promise<void> {
        const readStream = await this.generate(params);
        const writeStream = createWriteStream(filePath);
        await pipeline(readStream, writeStream);
    }

    /**
     * Convenience: generate and pipe into any writable stream
     * (e.g. an HTTP response, a Buffer, etc.)
     */
    async generateToStream(
        params: ImageGenerateParams,
        destination: NodeJS.WritableStream,
    ): Promise<void> {
        const readStream = await this.generate(params);
        await pipeline(readStream, destination);
    }
}
