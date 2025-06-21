import { asc, desc } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export type Reaction = "dislike" | "like" | "heart" | "none";

export const posts = sqliteTable(
    "posts",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        generatorId: integer("generator_id")
            .notNull()
            .references(() => generators.id),
        generatorName: text("generator_name").notNull(),
        imageUrl: text("image_url"),
        moreLink: text("more_link"),
        body: text("body"),
        timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
        seenCount: integer("seen_count").notNull().default(0),
        lastSeenTs: integer("last_seen_ts", { mode: "timestamp_ms" }),
        reaction: text("reaction").notNull().default("none"),
        reactionTs: integer("reaction_ts", { mode: "timestamp_ms" }),
    },
    table => [
        index("idx_posts_fresh").on(
            table.reaction,
            table.seenCount,
            desc(table.timestamp),
        ),
        index("idx_posts_revisit").on(
            table.reaction,
            table.seenCount,
            asc(table.lastSeenTs),
        ),
        index("idx_posts_saved").on(table.reaction, desc(table.reactionTs)),
    ],
);

export const GENERATOR_TYPES = ["feed", "text", "picture"] as const;
export type GeneratorType = (typeof GENERATOR_TYPES)[number];

export const generators = sqliteTable("generators", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type", { enum: GENERATOR_TYPES })
        .$type<GeneratorType>()
        .notNull(),
    config: text("config", { mode: "json" }).$type<unknown>().notNull(),
});

export const RUN_OUTCOMES = ["success", "error"] as const;
export type RunOutcome = (typeof RUN_OUTCOMES)[number];

export const generatorRuns = sqliteTable("generator_runs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    generatorId: integer("generator_id")
        .notNull()
        .references(() => generators.id),
    startTs: integer("start_ts", { mode: "timestamp" }).$type<Date>().notNull(),
    endTs: integer("end_ts", { mode: "timestamp" }).$type<Date | null>(),
    posts: integer("posts"),
    outcome: text("outcome", {
        enum: RUN_OUTCOMES,
    }).$type<RunOutcome | null>(),
    error: text("error"),
});

export const workerRuns = sqliteTable("worker_runs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    endedAt: integer("ended_at", { mode: "timestamp_ms" })
        .$type<Date | null>()
        .default(null),
    lastUpdate: integer("last_update", { mode: "timestamp_ms" }).notNull(),
    numGenerators: integer("num_generators").notNull(),
    successCount: integer("success_count").notNull().default(0),
    failCount: integer("fail_count").notNull().default(0),
    postCount: integer("post_count").notNull().default(0),
    failedIds: text("failed_ids", { mode: "json" })
        .$type<number[]>()
        .notNull()
        .default([] as number[]),
});
