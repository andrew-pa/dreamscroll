import type { Reaction } from '@/lib/db/schema';

export type { Reaction } from '@/lib/db/schema';

export interface PostRecord {
  id: number;
  generatorName: string;
  imageUrl?: string | null;
  moreLink?: string | null;
  body?: string | null;
  timestamp: Date;
  seenCount: number;
  lastSeenTs?: Date | null;
  reaction: Reaction;         // 'none' if no reaction
  reactionTs?: Date | null;
}

export type CreatePostRecord = Omit<PostRecord, 'id' | 'seenCount' | 'lastSeenTs' | 'reaction' | 'reactionTs'>;

export interface ScoringParams {
  candidatePoolSize: number;
  noveltyHalfLifeH: number;
  revisitHalfLifeH: number;
  maxRevisitsBeforeFade: number;
  weightNovelty: number;
  weightRevisit: number;
  reactionPenalty: {
      heart: number,
      like: number,
      dislike: number
  },
  randomness: number;
}

export type Cursor = { score: number; id: number } | null;

export function encodeCursor(c: Cursor) {
    if(!c) return null;
    return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

export function decodeCursor(s: string | null): Cursor | null {
    if (!s) return null;
    try { return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')); }
    catch { return null; }
}

export interface PostBatch {
    page: PostRecord[],
    next: Cursor
}

export interface IPostRepository {
  /** Insert a brand‑new post (not required by your UI but useful in tests). */
  create(post: CreatePostRecord): Promise<PostRecord>;

  /** The main feed endpoint. */
  selectBatch(now: Date, params: ScoringParams, cursor: Cursor, limit: number): Promise<PostBatch>;

  markSeen(id: number, when: Date): Promise<void>;

  toggleReaction(id: number, reaction: Reaction | 'none', when: Date): Promise<void>;
}

