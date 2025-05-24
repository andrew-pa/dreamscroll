'use client';

import {
  Box,
  VStack,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { useMemo, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import PostCard from '@/components/PostCard';
import { PostRecord } from '@/lib/repositories/postRepository';

interface PostBatch {
    page: PostRecord[],
    next: string | null
}

/* ---------- tweak to taste ---------- */
const PAGE_SIZE   = 50;  // matches DEFAULT_PARAMS.batchSize
const MAX_POSTS   = 500; // soft cap kept in memory
/* ------------------------------------ */

const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<PostBatch>);

/**
 * SWR “infinite” key:
 *   • first page → /api/unseen?limit=20
 *   • later pages → /api/unseen?limit=20&cursor=<opaque>
 *   • when nextCursor===null  → return `null`  (stop)
 */
const getKey =
  (_pageIndex: number, prev: PostBatch | null) =>
    prev && prev.next === null
      ? null
      : `/api/unseen?limit=${PAGE_SIZE}` +
        (prev?.next ? `&cursor=${prev.next}` : '');

export default function FeedPage() {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<PostBatch>(getKey, fetcher, { revalidateOnFocus: false });

  /* flat list for easy rendering */
  const posts = useMemo(
    () => (data ? data.flatMap(p => p.page) : []),
    [data],
  );

  /* sentinel that triggers the next fetch */
  const { ref: bottomRef, inView } = useInView();
  const lastPage = data?.[data.length - 1];
  const hasMore  = lastPage ? lastPage.next !== null : true;

  useEffect(() => {
    if (inView && hasMore && !isValidating) setSize(s => s + 1);
  }, [inView, hasMore, isValidating, setSize]);

  /* keep memory footprint bounded */
  useEffect(() => {
    if (posts.length > MAX_POSTS) {
      mutate(old =>
        old
          ? (() => {
              /* keep the newest MAX_POSTS items
                 and recompute their paging structure */
              const keep = posts.slice(-MAX_POSTS);
              const pages: PostBatch[] = [];
              for (let i = 0; i < keep.length; i += PAGE_SIZE) {
                pages.push({
                  page: keep.slice(i, i + PAGE_SIZE),
                  /* nextCursor is unknown for trimmed pages,
                     but SWR never re‑requests them, so null is fine. */
                  next: null,
                });
              }
              return pages;
            })()
          : old,
      );
    }
  }, [posts.length, mutate]);

  if (error) return <Center h="100vh">Failed to load new posts! 😢</Center>;

  return (
    <Box
      h="100vh"
      overflowY="auto"
      bg={{ base: 'gray.50', _dark: 'gray.900' }}
      px={{ base: 2, md: 4 }}
      py={4}
    >
      <VStack align="stretch">
        {posts.map(p => (
          <PostCard key={p.id} post={p} />
        ))}

        <Center ref={bottomRef} py={4}>
          {isValidating && <Spinner size="sm" />}
          {!hasMore && !isValidating && (
            <Box color="gray.500" fontSize="sm">
              ~ No more posts ~
            </Box>
          )}
        </Center>
      </VStack>
    </Box>
  );
}

