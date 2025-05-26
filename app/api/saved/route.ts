import { NextRequest, NextResponse } from "next/server";
import { getPostRepository } from "@/lib/repositories";
import type { Reaction } from "@/lib/db/schema";

const repo = getPostRepository();
const ALL: Reaction[] = ["like", "dislike", "heart"];

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // TODO: validate
    const reactionsStr = searchParams.get("reactions"); // e.g.  "like,heart"
    const reactions = reactionsStr
        ? (reactionsStr.split(",") as Reaction[])
        : ALL;

    const limit = Math.min(
        parseInt(searchParams.get("limit") ?? "200", 10),
        1000,
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const page = await repo.listSaved(reactions, limit, offset);
    return NextResponse.json({
        page,
        next: page.length === 0 ? null : offset + page.length,
    });
}
