import { Readable } from "stream";
import { MIMEType } from "util";

export interface StoredImage {
    body: Readable;
    contentType: MIMEType;
    size: number;
    etag?: string;
}

export interface IImageRepository {
    /** Stream upload into backend */
    put(filename: string, contentType: MIMEType, body: Readable): Promise<void>;

    /** Stream download from backend (returns null if missing) */
    get(filename: string): Promise<StoredImage | null>;
}
