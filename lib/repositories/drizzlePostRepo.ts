import { db } from "@/lib/db";
import { posts, type Reaction } from "@/lib/db/schema";
import {
    eq,
    sql,
    asc,
    desc,
    and,
    gt,
    gte,
    lte,
    inArray,
    isNotNull,
    notInArray,
} from "drizzle-orm";
import type {
    CreatePostRecord,
    Cursor,
    IPostRepository,
    PostBatch,
    PostRecord,
    ScoringParams,
} from "./postRepository";
import { pagenatedPosts, scorePosts } from "../scorePosts";

const HOUR = 3_600_000; // ms → hour

function postInsertValues(p: CreatePostRecord): Omit<PostRecord, "id"> {
    return {
        generatorId: p.generatorId,
        generatorName: p.generatorName,
        imageUrl: p.imageUrl,
        moreLink: p.moreLink,
        body: p.body,
        timestamp: p.timestamp ?? new Date(),
        seenCount: 0,
        reaction: "none",
    };
}

export class DrizzlePostRepository implements IPostRepository {
    async create(p: CreatePostRecord): Promise<PostRecord> {
        const [row] = await db
            .insert(posts)
            .values(postInsertValues(p))
            .returning();
        return row as PostRecord;
    }

    async createMany(newPosts: CreatePostRecord[]): Promise<void> {
        await db.insert(posts).values(newPosts.map(postInsertValues));
    }

    async markSeen(id: number, when: Date) {
        await db
            .update(posts)
            .set({
                seenCount: sql`seen_count + 1`,
                lastSeenTs: when,
            })
            .where(eq(posts.id, id));
    }

    async toggleReaction(id: number, reaction: Reaction | "none", when: Date) {
        await db
            .update(posts)
            .set({
                reaction,
                reactionTs: reaction === "none" ? null : when,
            })
            .where(eq(posts.id, id));
    }

    /** Feed selection (implements the scoring algo) ----------------------- */

    async selectBatch(
        now: Date,
        p: ScoringParams,
        cursor: Cursor,
        limit: number,
    ): Promise<PostBatch> {
        /* ---------- 1. fetch two narrow pools ---------- */
        const FIVE_HL = 5;
        const COOL_OFF = 0.25;

        const freshCutoff = new Date(
            now.getTime() - FIVE_HL * p.noveltyHalfLifeH * HOUR,
        );
        const revisitCutoff = new Date(
            now.getTime() - p.revisitHalfLifeH * COOL_OFF * HOUR,
        );

        const freshRows = await db
            .select()
            .from(posts)
            .where(
                and(eq(posts.seenCount, 0), gte(posts.timestamp, freshCutoff)),
            )
            .orderBy(desc(posts.timestamp))
            .limit(p.candidatePoolSize)
            .all();

        const revisRows = await db
            .select()
            .from(posts)
            .where(
                and(
                    gt(posts.seenCount, 0),
                    lte(posts.lastSeenTs, revisitCutoff),
                ),
            )
            .orderBy(asc(posts.lastSeenTs))
            .limit(p.candidatePoolSize)
            .all();

        const candidates = [...freshRows, ...revisRows] as PostRecord[];

        const scored = scorePosts(p, candidates, now);

        return pagenatedPosts(scored, cursor, limit);
    }

    async listSaved(
        reactionsFilter: Reaction[],
        limit: number,
        offset: number,
    ): Promise<PostRecord[]> {
        if (reactionsFilter.length === 0) return [];

        const rows = await db
            .select()
            .from(posts)
            .where(and(inArray(posts.reaction, reactionsFilter)))
            .orderBy(desc(posts.reactionTs))
            .limit(limit)
            .offset(offset)
            .all();

        return rows as PostRecord[];
    }
}
