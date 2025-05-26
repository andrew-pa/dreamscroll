"use client";

import { Center } from "@chakra-ui/react";
import { useInfinitePosts } from "@/lib/hooks/useInfinitePosts";
import { PostRecord } from "@/lib/repositories/postRepository";
import InfinitePostList from "@/components/InfinitePostList";

interface PostBatch {
    page: PostRecord[];
    next: string | null;
}

/* ---------- tweak to taste ---------- */
const PAGE_SIZE = 50; // matches DEFAULT_PARAMS.batchSize
const MAX_POSTS = 500; // soft cap kept in memory
/* ------------------------------------ */

/**
 * SWR “infinite” key:
 *   • first page → /api/unseen?limit=20
 *   • later pages → /api/unseen?limit=20&cursor=<opaque>
 *   • when nextCursor===null  → return `null`  (stop)
 */
const getKey = (_pageIndex: number, prev: PostBatch | null) =>
    prev && prev.next === null
        ? null
        : `/api/unseen?limit=${PAGE_SIZE}` +
          (prev?.next ? `&cursor=${prev.next}` : "");

export default function FeedPage() {
    const { posts, error, isLoading, hasMore, loadMore } =
        useInfinitePosts<PostBatch>(getKey, {
            pageSize: PAGE_SIZE,
            maxItems: MAX_POSTS,
            revalidateOnFocus: false,
        });

    if (error) return <Center h="100vh">Failed to load new posts! 😢</Center>;

    return (
        <InfinitePostList
            posts={posts}
            isLoading={isLoading}
            hasMore={hasMore}
            loadMore={loadMore}
        />
    );
}
