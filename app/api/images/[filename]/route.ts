import { NextRequest, NextResponse } from "next/server";
import { getImageRepository } from "@/lib/repositories";
import { MIMEType } from "util";

export const runtime = "nodejs"; // needs Node fs
export const maxDuration = 30; // Vercel Run‑time guard
export const dynamic = "force-dynamic";

const repo = getImageRepository();

// ---------- helpers -------------------------------------------------------

function cleanFilename(raw: string): string | null {
    // flat namespace; allow letters, digits, dash, underscore, dot
    if (!/^[\w\-\.]+$/.test(raw)) return null;
    return raw;
}

// ---------- PUT (upload) --------------------------------------------------

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename: rawFilename } = await params;
    const filename = cleanFilename(rawFilename);
    if (!filename)
        return NextResponse.json(
            { error: "invalid filename" },
            { status: 400 },
        );

    if (!req.body)
        return NextResponse.json({ error: "missing body" }, { status: 400 });

    const ct = new MIMEType(
        req.headers.get("content-type") ?? "unknown/unknown",
    );

    if (ct.type !== "image")
        return NextResponse.json(
            { error: "only image mime type allowed" },
            { status: 400 },
        );

    try {
        await repo.put(filename, ct, req.body);
        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "upload failed" }, { status: 500 });
    }
}

// ---------- GET (download) ------------------------------------------------

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename: rawFilename } = await params;
    const filename = cleanFilename(rawFilename);
    if (!filename)
        return NextResponse.json(
            { error: "invalid filename" },
            { status: 400 },
        );

    const img = await repo.get(filename);
    if (!img) return new NextResponse(null, { status: 404 });
    const { body, contentType, size, etag } = img;
    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": contentType.toString(),
            "Content-Length": size.toString(),
            "Cache-Control": "public,max-age=31536000,immutable",
            ...(etag && { ETag: etag }),
        },
    });
}
