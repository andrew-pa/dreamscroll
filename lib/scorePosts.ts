import { Cursor, PostBatch, PostRecord, ScoringParams } from "./repositories/postRepository";

/** ms → hour */
const HOUR = 3_600_000;

export interface ScoredPostRecord {
    post: PostRecord,
    score: number
}

export function scorePosts(p: ScoringParams, candidates: PostRecord[], now: Date): ScoredPostRecord[] {
    const scored: Array<{ post: PostRecord; score: number }> = [];
    for (const post of candidates) {
        const ageH = (now.getTime() - post.timestamp.getTime()) / HOUR;

        const novelty = p.weightNovelty * Math.exp(-ageH / p.noveltyHalfLifeH);

        let revisit = 0;
        if (post.seenCount > 0) {
            const hrsSinceSeen = (now.getTime() - (post.lastSeenTs ?? post.timestamp).getTime()) / HOUR;
            revisit =
                p.weightRevisit *
                Math.exp(-hrsSinceSeen / p.revisitHalfLifeH) *
                Math.exp(-post.seenCount / p.maxRevisitsBeforeFade);
        }

        const penalty = post.reaction != 'none' ? p.reactionPenalty[post.reaction] : 0;

        const score = (novelty + revisit - penalty) * (1-p.randomness)
            + Math.random() * p.randomness;

        scored.push({ post, score });
    }

    scored.sort((a, b) => b.score - a.score);

    return scored;
}

export function pagenatedPosts(scored: ScoredPostRecord[], cursor: Cursor, limit: number): PostBatch {
    // 3. apply cursor if present
    const start = cursor
        ? scored.findIndex(
            s =>
            s.score < cursor.score ||
                (s.score === cursor.score && s.post.id < cursor.id),
        )
            : 0;

    if (start === -1) return { page: [], next: null };

    // 4. slice the page
    const page = scored.slice(start, start + limit).map(s => s.post);

    // 5. derive nextCursor
    const last = page.at(-1);
    const nextCursor =
        page.length < limit
            ? null
            : {
                score: scored[start + limit - 1].score,
                id: last!.id,
            };

    return { page, next: nextCursor };
}
