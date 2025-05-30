import { NextRequest, NextResponse } from "next/server";
import type { Reaction } from "@/lib/db/schema";
import { getPostRepository } from "@/lib/repositories";

const repo = getPostRepository();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { reaction } = (await req.json()) as { reaction: Reaction | "none" };
    const { id } = await params;
    await repo.toggleReaction(Number(id), reaction ?? "none", new Date());
    return NextResponse.json({ ok: true, reaction });
}
