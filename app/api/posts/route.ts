import { NextRequest, NextResponse } from 'next/server';
import { DrizzlePostRepository } from '@/lib/repositories/drizzlePostRepo';
import { CreatePostRecord } from '@/lib/repositories/postRepository';

const repo = new DrizzlePostRepository();

export async function POST(req: NextRequest) {
    const post = await req.json() as CreatePostRecord;
    const created = await repo.create(post);
    return NextResponse.json({
        id: created.id
    });
}
