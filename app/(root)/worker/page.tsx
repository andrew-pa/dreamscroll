"use client";
import React from "react";
import {
    Box,
    Heading,
    Table,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Text,
    Popover,
    Portal,
    Button,
} from "@chakra-ui/react";
import useSWR from "swr";
import type { WorkerRunRecord } from "@/lib/repositories";
import { RunProgressBar } from "@/components/RunProgressBar";
import { workerRunRecordFromJson } from "@/lib/repositories/workerRunRepository";

interface RunsResponse {
    page: WorkerRunRecord[];
    errors?: Record<string, { id: number; name: string; error: string }[]>;
}

const fetcher = (url: string) =>
    fetch(url)
        .then(r => r.json())
        .then(r => ({
            ...r,
            page: r.page?.map(workerRunRecordFromJson),
        }));

function ErrorListPopover({
    errList,
}: {
    errList: { id: number; name: string; error: string }[];
}) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button size="md">Show Errors</Button>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner>
                    <Popover.Content>
                        <Popover.Body>
                            {errList.map(e => (
                                <Box key={e.id} mb={4}>
                                    <Text fontWeight="bold" mb={1}>
                                        {e.name} (#{e.id})
                                    </Text>
                                    <Text whiteSpace="pre-wrap">{e.error}</Text>
                                </Box>
                            ))}
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}

export default function WorkerRunsPage() {
    const { data } = useSWR<RunsResponse>(
        "/api/worker-runs?limit=20&withErrors=1",
        fetcher,
        { refreshInterval: 30000 },
    );

    const runs = data?.page ?? [];
    const errors = data?.errors ?? {};

    const formatDuration = (run: WorkerRunRecord) => {
        const end = run.endedAt ? new Date(run.endedAt) : new Date();
        const start = new Date(run.startedAt);
        const ms = end.getTime() - start.getTime();
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${m}m ${s}s`;
    };

    return (
        <Box p={6} maxW="6xl" mx="auto">
            <Heading mb={8}>Worker Runs</Heading>
            <Table.Root striped stickyHeader interactive>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Started</Table.ColumnHeader>
                        <Table.ColumnHeader>Ended</Table.ColumnHeader>
                        <Table.ColumnHeader>Duration</Table.ColumnHeader>
                        <Table.ColumnHeader># Generators</Table.ColumnHeader>
                        <Table.ColumnHeader w="40%">
                            Generator Outcome
                        </Table.ColumnHeader>
                        <Table.ColumnHeader># Posts</Table.ColumnHeader>
                        <Table.ColumnHeader>Errors</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {runs.map(run => {
                        const key = new Date(run.startedAt).getTime();
                        return (
                            <React.Fragment key={key}>
                                <Table.Row>
                                    <Table.Cell>
                                        {run.startedAt.toLocaleString()}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {run.endedAt
                                            ? run.endedAt.toLocaleString()
                                            : ""}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {formatDuration(run)}
                                    </Table.Cell>
                                    <Table.Cell>{run.numGenerators}</Table.Cell>
                                    <Table.Cell>
                                        <RunProgressBar
                                            successCount={run.successCount}
                                            failCount={run.failCount}
                                            total={run.numGenerators}
                                        />
                                    </Table.Cell>
                                    <Table.Cell>{run.postCount}</Table.Cell>
                                    <Table.Cell>
                                        {errors[key] &&
                                            errors[key].length > 0 && (
                                                <ErrorListPopover
                                                    errList={errors[key]}
                                                />
                                            )}
                                    </Table.Cell>
                                </Table.Row>
                            </React.Fragment>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
