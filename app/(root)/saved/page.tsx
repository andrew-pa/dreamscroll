"use client";

import { Center } from "@chakra-ui/react";
import { useState } from "react";
import { useInfinitePosts } from "@/lib/hooks/useInfinitePosts";
import { PostRecord, Reaction } from "@/lib/repositories/postRepository";
import InfinitePostList from "@/components/InfinitePostList";
import ReactionFilterBar from "./ReactionFilterBar";

interface PostBatch {
    page: PostRecord[];
    next: number | null;
}

/* ---------- tweak to taste ---------- */
const PAGE_SIZE = 50; // matches DEFAULT_PARAMS.batchSize
const MAX_POSTS = 500; // soft cap kept in memory
/* ------------------------------------ */

const getKey =
    (filters: Reaction[]) => (_pageIndex: number, prev: PostBatch | null) =>
        prev && prev.next === null
            ? null
            : `/api/saved?reactions=${filters.join(",")}&limit=${PAGE_SIZE}${prev?.next ? `&offset=${prev.next}` : ""}`;

export default function SavedPostsPage() {
    const [filters, setFilters] = useState<Reaction[]>(["like", "heart"]);

    const toggle = (r: Reaction) =>
        setFilters(f => (f.includes(r) ? f.filter(x => x !== r) : [...f, r]));

    const { posts, error, isLoading, hasMore, loadMore } =
        useInfinitePosts<PostBatch>(getKey(filters), {
            pageSize: PAGE_SIZE,
            maxItems: MAX_POSTS,
            revalidateOnFocus: false,
        });

    if (error) return <Center h="100vh">Failed to load posts! 😢</Center>;

    return (
        <>
            <ReactionFilterBar selected={filters} onToggle={toggle} />
            <InfinitePostList
                posts={posts}
                isLoading={isLoading}
                hasMore={hasMore}
                loadMore={loadMore}
            />
        </>
    );
}
