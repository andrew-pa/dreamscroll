import { MIMEType } from "util";

export interface StoredImage {
    body: ReadableStream;
    contentType: MIMEType;
    size: number;
    etag?: string;
}

export interface IImageRepository {
    /** Stream upload into backend */
    put(id: string, contentType: MIMEType, body: ReadableStream): Promise<void>;

    /** Stream download from backend (returns null if missing) */
    get(filename: string): Promise<StoredImage | null>;
}
