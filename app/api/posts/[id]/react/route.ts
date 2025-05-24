import { NextRequest, NextResponse } from "next/server";
import { DrizzlePostRepository } from "@/lib/repositories/drizzlePostRepo";
import type { Reaction } from "@/lib/db/schema";

const repo = new DrizzlePostRepository();

export async function POST(
    req: NextRequest,
    params: Promise<{ params: { id: string } }>,
) {
    const { reaction } = (await req.json()) as { reaction: Reaction | "none" };
    const {
        params: { id },
    } = await params;
    await repo.toggleReaction(Number(id), reaction ?? "none", new Date());
    return NextResponse.json({ ok: true, reaction });
}
