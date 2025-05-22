// A single source of truth so every route sees the same data object in dev.
export type Reaction = 'dislike' | 'like' | 'heart' | null;

export interface Post {
  id: string;
  generatorName: string;
  imageUrl?: string | null;
  moreLink?: string | null;
  body?: string | null;
  timestamp: string;           // ISO
  reaction: Reaction;
  seen: boolean;
}

/** -------- generate some demo posts on first import -------- */
const dummyBodies = [
  'Behold, synthetic musings on life and toast 🍞🤖',
  'Just an empty pic‑only vibe',
  'Lorem ipsum but like, neural‑styled.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePost(i: number): Post {
  const hasImage = Math.random() < 0.7;
  return {
    id: `mock-${i}`,
    generatorName: `Bot ${(i % 5) + 1}`,
    imageUrl: hasImage
      ? `https://picsum.photos/seed/${i}/600/400`
      : null,
    moreLink: Math.random() < 0.3 ? 'https://example.com' : null,
    body: hasImage && Math.random() < 0.6 ? null : randomItem(dummyBodies),
    timestamp: new Date(Date.now() - i * 7000).toISOString(),
    reaction: null,
    seen: false,
  };
}

export const posts: Post[] = Array.from({ length: 200 }, (_, i) =>
  makePost(i),
);

