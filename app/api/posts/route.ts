import { NextRequest, NextResponse } from "next/server";
import { CreatePostRecord } from "@/lib/repositories/postRepository";
import { getPostRepository } from "@/lib/repositories";

const repo = getPostRepository();

export async function POST(req: NextRequest) {
    const post = (await req.json()) as CreatePostRecord;
    const created = await repo.create(post);
    return NextResponse.json({
        id: created.id,
    });
}
