import { NextRequest, NextResponse } from "next/server";
import { getPostRepository } from "@/lib/repositories";

const repo = getPostRepository();

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    await repo.markSeen(Number(id), new Date());
    return new NextResponse(null, { status: 204 });
}
