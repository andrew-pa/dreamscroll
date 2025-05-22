import { NextRequest, NextResponse } from 'next/server';
import { posts } from '../../../mock-data';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const p = posts.find(p => p.id === params.id);
  if (p) p.seen = true;

  // 204 No Content is fine here.
  return new NextResponse(null, { status: 204 });
}

