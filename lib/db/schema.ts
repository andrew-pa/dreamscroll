import { asc, desc } from 'drizzle-orm';
import {
    sqliteTable,
    text,
    integer,
    index,
} from 'drizzle-orm/sqlite-core';

export type Reaction = 'dislike' | 'like' | 'heart' | 'none';

export const posts = sqliteTable('posts', {
    id:          integer('id').primaryKey({ autoIncrement: true }),
    generatorName: text('generator_name').notNull(),
    imageUrl:    text('image_url'),
    moreLink:    text('more_link'),
    body:        text('body'),
    timestamp:   integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
    seenCount:   integer('seen_count').notNull().default(0),
    lastSeenTs:  integer('last_seen_ts', { mode: 'timestamp_ms' }),
    reaction:    text('reaction').notNull().default('none'),
    reactionTs:  integer('reaction_ts', { mode: 'timestamp_ms' }),
}, table => [
    index("idx_posts_fresh").on(table.reaction, table.seenCount, desc(table.timestamp)),
    index("idx_posts_revisit").on(table.reaction, table.seenCount, asc(table.lastSeenTs)),
]);
