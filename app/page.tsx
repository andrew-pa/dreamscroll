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
import PostCard, { Post } from '@/components/PostCard';

const PAGE_SIZE = 15;
const MAX_POSTS = 200;

const fetcher = (url: string) => fetch(url).then(r => r.json());
const key = (page: number, prev: Post[] | null) =>
  prev && prev.length === 0
    ? null
    : `/api/unseen?limit=${PAGE_SIZE}&after=${prev?.at(-1)?.timestamp ?? ''}`;

export default function FeedPage() {
  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<Post[]>(key, fetcher, { revalidateOnFocus: false });

  const posts = useMemo(() => (data ? ([] as Post[]).concat(...data) : []), [data]);

  /** sentinel to pull the next page */
  const { ref: bottomRef, inView: bottomVisible } = useInView();
  useEffect(() => {
    if (bottomVisible && !isValidating) setSize(s => s + 1);
  }, [bottomVisible, isValidating, setSize]);

  /** keep memory footprint small */
  useEffect(() => {
    if (posts.length > MAX_POSTS) {
      mutate(old =>
        old
          ? old
              .flat()
              .slice(posts.length - MAX_POSTS) // keep newest N
              .reduce<Post[][]>((acc, p, i) => {
                const page = Math.floor(i / PAGE_SIZE);
                (acc[page] ??= []).push(p);
                return acc;
              }, [])
          : old,
      );
    }
  }, [posts.length, mutate]);

  if (error) return <Center h="100vh">failed to load 😢</Center>;

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
        </Center>
      </VStack>
    </Box>
  );
}

