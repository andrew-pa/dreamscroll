import { NextRequest, NextResponse } from "next/server";
import {
    decodeCursor,
    encodeCursor,
    ScoringParams,
} from "@/lib/repositories/postRepository";
import { getPostRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

const repo = getPostRepository();

/** Default UX values (same as your table). */
const DEFAULT_PARAMS: ScoringParams = {
    candidatePoolSize: 250,
    noveltyHalfLifeH: 4,
    revisitHalfLifeH: 8,
    maxRevisitsBeforeFade: 3,
    weightNovelty: 1.0,
    weightRevisit: 0.6,
    reactionPenalty: {
        heart: 0.4,
        like: 1,
        dislike: 4,
    },
    randomness: 0.01,
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
        parseInt(searchParams.get("limit") ?? "20", 10),
        100,
    );
    const cursor = decodeCursor(searchParams.get("cursor"));
    const batch = await repo.selectBatch(
        new Date(),
        DEFAULT_PARAMS,
        cursor,
        limit,
    );
    return NextResponse.json({
        page: batch.page,
        next: encodeCursor(batch.next),
    });
}
