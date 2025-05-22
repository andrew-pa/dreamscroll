import { NextRequest, NextResponse } from 'next/server';
import { posts, Reaction } from '../../../mock-data';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { reaction } = (await req.json()) as { reaction: Reaction };
  const p = posts.find(p => p.id === params.id);
  if (p) p.reaction = reaction;

  return NextResponse.json({ ok: true, reaction }, { status: 200 });
}

