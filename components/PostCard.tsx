"use client";

import {
    Box,
    Text,
    Image,
    HStack,
    IconButton,
    Badge,
    Link as ChakraLink,
    AspectRatio,
} from "@chakra-ui/react";
import { AiOutlineDislike, AiOutlineLike, AiFillHeart } from "react-icons/ai";
import { useInView } from "react-intersection-observer";
import { useState, useEffect, useRef } from "react";
import { PostRecord, Reaction } from "@/lib/repositories/postRepository";
import Markdown from "react-markdown";
import styles from "./Markdown.module.css";

interface Props {
    post: PostRecord;
}

export default function PostCard({ post }: Props) {
    const [reaction, setReaction] = useState<Reaction>(post.reaction);

    /** mark‑seen once when it scrolls above the viewport */
    const hasMarked = useRef(false);
    const { ref, inView, entry } = useInView({
        threshold: 0,
        rootMargin: "-1px 0px 0px 0px",
    });

    useEffect(() => {
        if (
            !inView &&
            entry &&
            entry.boundingClientRect.top < 0 &&
            !hasMarked.current
        ) {
            fetch(`/api/posts/${post.id}/seen`, { method: "POST" });
            hasMarked.current = true;
        }
    }, [inView, entry, post.id]);

    /** toggle reaction */
    const toggle = async (kind: Reaction) => {
        const next = reaction === kind ? "none" : kind;
        setReaction(next);
        await fetch(`/api/posts/${post.id}/react`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reaction: next }),
        });
    };

    return (
        <Box
            ref={ref}
            bg={{ base: "white", _dark: "gray.800" }}
            rounded="md"
            shadow="sm"
            p={4}
        >
            <HStack justify="space-between" mb={2} flexWrap="wrap">
                <Badge paddingX="2">{post.generatorName}</Badge>
                <Text fontSize="xs" color="fg.muted">
                    {new Date(post.timestamp).toLocaleTimeString()}
                </Text>
            </HStack>

            {post.imageUrl && (
                <AspectRatio w="full" ratio={1} mb={2}>
                    <Image
                        src={post.imageUrl}
                        alt="generated visual"
                        w="full"
                        rounded="md"
                        loading="lazy"
                        objectFit="cover"
                    />
                </AspectRatio>
            )}

            {post.body && (
                <Box mb={2} className={styles.markdown}>
                    <Markdown>{post.body}</Markdown>
                </Box>
            )}

            {post.moreLink && (
                <ChakraLink href={post.moreLink} color="teal.500">
                    More
                </ChakraLink>
            )}

            <HStack mt={2} gap={3} justify="right">
                <IconButton
                    aria-label="dislike"
                    size="sm"
                    variant={reaction === "dislike" ? "solid" : "ghost"}
                    onClick={() => toggle("dislike")}
                >
                    <AiOutlineDislike />
                </IconButton>

                <IconButton
                    aria-label="like"
                    size="sm"
                    variant={reaction === "like" ? "solid" : "ghost"}
                    onClick={() => toggle("like")}
                >
                    <AiOutlineLike />
                </IconButton>

                <IconButton
                    aria-label="heart"
                    size="sm"
                    colorScheme="pink"
                    variant={reaction === "heart" ? "solid" : "ghost"}
                    onClick={() => toggle("heart")}
                >
                    <AiFillHeart />
                </IconButton>
            </HStack>
        </Box>
    );
}
