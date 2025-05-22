import { NextRequest, NextResponse } from 'next/server';
import { posts } from '../mock-data';

export const dynamic = 'force-dynamic'; // make sure dev hot‑reload works

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '15', 10);
  const after = searchParams.get('after'); // ISO timestamp or '' on first fetch

  /** select unseen posts that are newer than `after` (or all if none) */
  const batch = posts
    .filter(p => !p.seen)
    .filter(p => (after ? p.timestamp > after : true))
    .slice(0, limit);

  return NextResponse.json(batch);
}

