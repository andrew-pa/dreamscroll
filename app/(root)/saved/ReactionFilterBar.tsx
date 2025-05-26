"use client";

import { Button, Group, HStack } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { AiOutlineLike, AiOutlineDislike, AiFillHeart } from "react-icons/ai";
import { Reaction } from "@/lib/repositories/postRepository";
import { JSX } from "react";

interface Props {
    selected: Reaction[];
    onToggle(r: Reaction): void;
}

const icons: Record<Exclude<Reaction, "none">, JSX.Element> = {
    like: <AiOutlineLike />,
    dislike: <AiOutlineDislike />,
    heart: <AiFillHeart />,
};

const labels: Record<Exclude<Reaction, "none">, string> = {
    like: "Liked",
    dislike: "Disliked",
    heart: "Hearted",
};

export default function ReactionFilterBar({ selected, onToggle }: Props) {
    return (
        <HStack w="full" justify="center" py={3}>
            <Group attached>
                {(
                    ["like", "heart", "dislike"] as Exclude<Reaction, "none">[]
                ).map(r => (
                    <Tooltip key={r} showArrow content={labels[r]}>
                        <Button
                            size="sm"
                            onClick={() => onToggle(r)}
                            variant={selected.includes(r) ? "solid" : "outline"}
                            aria-pressed={selected.includes(r)}
                        >
                            {icons[r]}
                        </Button>
                    </Tooltip>
                ))}
            </Group>
        </HStack>
    );
}
