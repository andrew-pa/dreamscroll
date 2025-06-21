"use client";
import {
    Flex,
    IconButton,
    Link,
    Heading,
    Drawer,
    VStack,
    useDisclosure,
} from "@chakra-ui/react";
import {
    FiBookmark,
    FiSettings,
    FiMenu,
} from "react-icons/fi";
import NextLink from "next/link";
import useSWR from "swr";
import WorkerStatusIndicator from "./WorkerStatusIndicator";
import { WorkerRunPopoverContent } from "./WorkerRunPopoverContent";
import { workerRunRecordFromJson } from "@/lib/repositories/workerRunRepository";
import type { WorkerRunRecord } from "@/lib/repositories";

function WorkerStatusPanel() {
    const { data } = useSWR<WorkerRunRecord | null>(
        "/api/worker-runs/latest",
        url =>
            fetch(url)
                .then(r => r.json())
                .then(workerRunRecordFromJson),
        { refreshInterval: 30000 },
    );
    return <WorkerRunPopoverContent run={data ?? null} />;
}

export function NavBar() {
    const { open, onOpen, onClose } = useDisclosure();

    return (
        <Flex
            as="header"
            position="sticky"
            top="0"
            insetX="0"
            h={{ base: "56px", md: "64px" }}
            px={{ base: 3, md: 6 }}
            align="center"
            bg="var(--chakra-colors-bg)" /* adapts to color‑mode via CSS var */
            borderBottom="1px solid var(--chakra-colors-border)"
            zIndex="banner"
        >
            {/* LEFT - saved posts */}
            <Flex flex="1" gap="2">
                <NavIcon
                    href="/saved"
                    label="Saved posts"
                    icon={<FiBookmark />}
                />
            </Flex>

            {/* Center title */}
            <Heading
                as="h1"
                fontFamily="'Pacifico', cursive"
                fontSize={{ base: "lg", md: "xl" }}
                textTransform="lowercase"
                lineHeight="1"
                position="absolute"
                left="50%"
                transform="translateX(-50%)"
            >
                <Link as={NextLink} href="/" color="inherit" textDecor="none">
                    dreamscroll
                </Link>
            </Heading>

            {/* RIGHT - icons or drawer */}
            <Flex flex="1" justify="flex-end" gap="2">
                <WorkerStatusIndicator
                    display={{ base: "none", md: "inline-flex" }}
                />
                <NavIcon
                    href="/generators"
                    label="Generators"
                    icon={<FiSettings />}
                    display={{ base: "none", md: "inline-flex" }}
                />
                {/* Drawer toggle on mobile */}
                <IconButton
                    aria-label="Menu"
                    variant="ghost"
                    size="md"
                    minW="40px"
                    onClick={onOpen}
                    display={{ base: "inline-flex", md: "none" }}
                >
                    <FiMenu />
                </IconButton>
            </Flex>

            <Drawer.Root open={open} onOpenChange={e => (e.open ? onOpen() : onClose())}>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content maxW="xs">
                        <Drawer.CloseTrigger />
                        <Drawer.Body p={4}>
                            <VStack align="stretch" gap={4}>
                                <Link
                                    as={NextLink}
                                    href="/generators"
                                    onClick={onClose}
                                    fontSize="lg"
                                >
                                    Generators
                                </Link>
                                <Link
                                    as={NextLink}
                                    href="/worker"
                                    onClick={onClose}
                                    fontSize="lg"
                                >
                                    Workers
                                </Link>
                                <WorkerStatusPanel />
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </Flex>
    );
}

/* ---------- generic icon‑link helper ---------- */
interface NavIconProps {
    href: string;
    label: string;
    icon: React.ReactElement;
    display?: Record<string, string>;
}
function NavIcon({ href, label, icon, display }: NavIconProps) {
    return (
        <Link
            as={NextLink}
            href={href}
            _focusVisible={{ boxShadow: "outline" }}
            display={display}
        >
            <IconButton
                aria-label={label}
                variant="ghost"
                size="md"
                minW="40px"
            >
                {icon}
            </IconButton>
        </Link>
    );
}
