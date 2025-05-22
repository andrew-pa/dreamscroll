'use client';

import {
  Box,
  Text,
  Image,
  HStack,
  IconButton,
  Badge,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { AiOutlineDislike, AiOutlineLike, AiFillHeart } from 'react-icons/ai';
import { motion, isValidMotionProp } from 'framer-motion';
import { chakra } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect, useRef } from 'react';

export type Reaction = 'dislike' | 'like' | 'heart' | null;

export interface Post {
  id: string;
  generatorName: string;
  imageUrl?: string | null;
  moreLink?: string | null;
  body?: string | null;
  timestamp: string; // ISO
  reaction: Reaction;
}

const MotionBox = chakra(motion.div, {
  shouldForwardProp: prop =>
    isValidMotionProp(prop) || ['children'].includes(prop as string),
});

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const [reaction, setReaction] = useState<Reaction>(post.reaction);

  /** mark‑seen once when it scrolls above the viewport */
  const hasMarked = useRef(false);
  const { ref, inView, entry } = useInView({
    threshold: 0,
    rootMargin: '-1px 0px 0px 0px',
  });

  useEffect(() => {
    if (!inView && entry?.boundingClientRect.top! < 0 && !hasMarked.current) {
      fetch(`/api/posts/${post.id}/seen`, { method: 'POST' });
      hasMarked.current = true;
    }
  }, [inView, entry, post.id]);

  /** toggle reaction */
  const toggle = async (kind: Reaction) => {
    const next = reaction === kind ? null : kind;
    setReaction(next);
    await fetch(`/api/posts/${post.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: next }),
    });
  };

  return (
    <MotionBox
      ref={ref}
      bg={{ base: 'white', _dark: 'gray.800' }}
      rounded="md"
      shadow="sm"
      p={4}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      layout
    >
      <HStack justify="space-between" mb={2} flexWrap="wrap">
        <Badge paddingX="2">{post.generatorName}</Badge>
        <Text fontSize="xs" color="fg.muted">
          {new Date(post.timestamp).toLocaleTimeString()}
        </Text>
      </HStack>

      {post.imageUrl && (
        <Image
          src={post.imageUrl}
          alt="generated visual"
          w="full"
          rounded="md"
          mb={2}
          loading="lazy"
        />
      )}

      {post.body && (
        <Text mb={2} whiteSpace="pre-wrap">
          {post.body}
        </Text>
      )}

      {post.moreLink && (
        <ChakraLink href={post.moreLink} color="teal.500">
            More
        </ChakraLink>
      )}

      <HStack mt={3} gap={3}>
        <IconButton
          aria-label="dislike"
          size="sm"
          variant={reaction === 'dislike' ? 'solid' : 'ghost'}
          onClick={() => toggle('dislike')}
        >
          <AiOutlineDislike />
        </IconButton>

        <IconButton
          aria-label="like"
          size="sm"
          variant={reaction === 'like' ? 'solid' : 'ghost'}
          onClick={() => toggle('like')}
        >
          <AiOutlineLike />
        </IconButton>

        <IconButton
          aria-label="heart"
          size="sm"
          colorScheme="pink"
          variant={reaction === 'heart' ? 'solid' : 'ghost'}
          onClick={() => toggle('heart')}
        >
          <AiFillHeart />
        </IconButton>
      </HStack>
    </MotionBox>
  );
}

