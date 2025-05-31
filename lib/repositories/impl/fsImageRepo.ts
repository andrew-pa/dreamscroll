import { mkdir, stat } from "node:fs/promises";
import { createWriteStream, createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { extname, resolve } from "node:path";
import { Readable } from "stream";
import { MIMEType } from "util";
import { IImageRepository, StoredImage } from "../imageRepository";

const STORAGE_DIR = resolve(process.env.IMAGE_DIR ?? ".images");

async function ensureDir() {
    await mkdir(STORAGE_DIR, { recursive: true });
}

function pathFor(filename: string) {
    return resolve(STORAGE_DIR, filename);
}

export class FsImageRepo implements IImageRepository {
    constructor() {
        ensureDir();
    }

    async put(
        filename: string,
        contentType: MIMEType,
        body: Readable,
    ): Promise<void> {
        if (contentType.type !== "image") throw new Error("only images!");
        if (extname(filename).substring(1) !== contentType.subtype)
            throw new Error("filename extention does not match mimetype");
        const ws = createWriteStream(pathFor(filename), {
            flags: "w",
            encoding: "binary",
        });
        await pipeline(body, ws);
    }

    async get(filename: string): Promise<StoredImage | null> {
        try {
            const full = pathFor(filename);
            const st = await stat(full); // throws ENOENT -> 404
            // TODO: this is bad
            const ext = extname(full).substring(1);
            const contentType = new MIMEType(`image/${ext}`);
            return {
                contentType,
                body: createReadStream(full),
                size: st.size,
                etag: `"${st.mtimeMs.toString(16)}-${st.size.toString(16)}"`,
            };
        } catch (e) {
            const err = e as { code?: string };
            if (err.code === "ENOENT") {
                return null;
            }
            throw e;
        }
    }
}
