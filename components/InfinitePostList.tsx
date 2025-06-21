"use client";

import { Center, Spinner, VStack, Box } from "@chakra-ui/react";
import { useInView } from "react-intersection-observer";
import { PostRecord } from "@/lib/repositories/postRepository";
import PostCard from "./PostCard";
import { useEffect } from "react";

interface Props {
    posts: PostRecord[];
    isLoading: boolean;
    hasMore: boolean;
    loadMore(): void;
    emptyMessage?: string;
}

export default function InfinitePostList({
    posts,
    isLoading,
    hasMore,
    loadMore,
}: Props) {
    /* sentinel */
    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasMore && !isLoading) loadMore();
    }, [inView, hasMore, isLoading, loadMore]);

    return (
        <Box maxW={{ base: "full", md: "3xl" }} mx="auto">
            <VStack align="stretch" px={{ base: 2, md: 4 }} py={4}>
                {posts.map(p => (
                    <PostCard key={p.id} post={p} />
                ))}

                <Center ref={ref} py={4}>
                    {isLoading && <Spinner size="sm" />}
                    {!hasMore && posts.length > 0 && !isLoading && (
                        <Box fontSize="sm" color="fg.muted">
                            ~ and that&apos;s the end! ~
                        </Box>
                    )}
                    {posts.length === 0 && !isLoading && (
                        <Box color="fg.muted">~ No posts ~</Box>
                    )}
                </Center>
            </VStack>
        </Box>
    );
}
