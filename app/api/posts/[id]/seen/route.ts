import { NextRequest, NextResponse } from "next/server";
import { DrizzlePostRepository } from "@/lib/repositories/drizzlePostRepo";

const repo = new DrizzlePostRepository();

export async function POST(
    _req: NextRequest,
    params: Promise<{ params: { id: string } }>,
) {
    const {
        params: { id },
    } = await params;
    await repo.markSeen(Number(id), new Date());
    return new NextResponse(null, { status: 204 });
}
