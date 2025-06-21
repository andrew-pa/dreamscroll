"use client";

import {
    Card,
    CardHeader,
    Button,
    Field,
    Heading,
    IconButton,
    Input,
    Text,
    Textarea,
    HStack,
    Stack,
    Box,
    useDisclosure,
} from "@chakra-ui/react";
import { FiTrash, FiCopy, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useMemo, useState, useTransition } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { GeneratorWithRun } from "./actions";
import {
    updateGenerator,
    deleteGenerator,
    duplicateGenerator,
} from "./actions";
import type { GeneratorRunRecord } from "@/lib/repositories";
import { toaster } from "@/components/ui/toaster";

function RunInfo({ run }: { run: GeneratorRunRecord | null }): JSX.Element {
    if (!run) {
        return (
            <Text>
                <strong>Last run:</strong> never
            </Text>
        );
    }
    const duration = run.endTs
        ? ((run.endTs.getTime() - run.startTs.getTime()) / 1000).toFixed(1)
        : null;
    return (
        <>
            <Text>
                <strong>Last run:</strong>{" "}
                {(run.endTs ?? run.startTs).toLocaleString()}
            </Text>
            {run.endTs ? (
                <>
                    <Text>
                        <strong>Duration:</strong> {duration}s
                    </Text>
                    <Text>
                        <strong>Posts:</strong> {run.posts ?? 0}
                    </Text>
                    <Text
                        color={
                            run.outcome === "success" ? "green.500" : "red.500"
                        }
                    >
                        <strong>Outcome:</strong> {run.outcome}
                    </Text>
                    {run.error && (
                        <details>
                            <summary>Error</summary>
                            <pre>{run.error}</pre>
                        </details>
                    )}
                </>
            ) : (
                <Text color="orange.500">Run did not finish</Text>
            )}
        </>
    );
}

export default function GeneratorCard({ g }: { g: GeneratorWithRun }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const { open: showConfig, onToggle } = useDisclosure({
        defaultOpen: false,
    });

    const [name, setName] = useState(g.name);
    const [configText, setConfigText] = useState(
        JSON.stringify(g.config, null, 2),
    );

    const { parsedOk, parseError } = useMemo(() => {
        try {
            JSON.parse(configText);
            return { parsedOk: true };
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            return { parsedOk: false, parseError: errorMessage };
        }
    }, [configText]);

    const dirty =
        name.trim() !== g.name ||
        configText !== JSON.stringify(g.config, null, 2);

    /* ---- actions ---- */
    const save = () =>
        startTransition(async () => {
            await updateGenerator(g.id, name.trim(), JSON.parse(configText));
            toaster.create({
                type: "success",
                description: `Saved “${name.trim()}”`,
            });
            router.refresh();
        });

    const destroy = () => {
        if (!confirm(`Delete generator “${g.name}”?`)) return;
        startTransition(async () => {
            await deleteGenerator(g.id);
            toaster.create({
                type: "info",
                description: `Deleted “${g.name}”`,
            });
            router.refresh();
        });
    };

    const duplicate = () =>
        startTransition(async () => {
            await duplicateGenerator(g.id);
            toaster.create({
                type: "success",
                description: `Duplicated “${g.name}”`,
            });
            router.refresh();
        });

    return (
        <Card.Root>
            <CardHeader>
                <HStack align="center" gap={2} justify="space-between">
                    <Heading size="sm">#{g.id}</Heading>
                    <HStack gap={1}>
                        <IconButton
                            aria-label="Duplicate generator"
                            variant="ghost"
                            onClick={duplicate}
                        >
                            <FiCopy />
                        </IconButton>
                        <IconButton
                            aria-label="Delete generator"
                            variant="ghost"
                            colorScheme="red"
                            onClick={destroy}
                        >
                            <FiTrash />
                        </IconButton>
                    </HStack>
                </HStack>
            </CardHeader>

            <Card.Body display="flex" flexDirection="column" gap={4}>
                <Stack
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                    align="flex-start"
                >
                    <Box>
                        <Text>
                            <strong>Type:</strong> {g.type}
                        </Text>

                        <RunInfo run={g.lastRun} />
                    </Box>

                    <Field.Root required flex="1">
                        <Field.Label>Name</Field.Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </Field.Root>
                </Stack>

                <Field.Root invalid={!parsedOk}>
                    <HStack justify="space-between" align="center">
                        <Field.Label>Config (JSON)</Field.Label>
                        <IconButton
                            aria-label={
                                showConfig ? "Hide config" : "Show config"
                            }
                            size="sm"
                            variant="ghost"
                            onClick={onToggle}
                        >
                            {showConfig ? <FiChevronUp /> : <FiChevronDown />}
                        </IconButton>
                    </HStack>
                    {showConfig && (
                        <>
                            <Textarea
                                mt={2}
                                rows={8}
                                fontFamily="mono"
                                value={configText}
                                onChange={e => setConfigText(e.target.value)}
                            />
                            <Field.ErrorText>
                                Invalid JSON: {parseError}
                            </Field.ErrorText>
                        </>
                    )}
                </Field.Root>
            </Card.Body>

            <Card.Footer>
                {dirty && (
                    <Button
                        colorScheme="teal"
                        onClick={save}
                        disabled={!parsedOk}
                        loading={isPending}
                    >
                        Save
                    </Button>
                )}
            </Card.Footer>
        </Card.Root>
    );
}
