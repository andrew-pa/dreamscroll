"use client";
import React from "react";
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Text,
} from "@chakra-ui/react";
import useSWR from "swr";
import type { WorkerRunRecord } from "@/lib/repositories";
import { RunProgressBar } from "@/components/RunProgressBar";

export const metadata = { title: "Worker status" };

interface RunsResponse {
    page: WorkerRunRecord[];
    errors?: Record<string, { id: number; name: string; error: string }[]>;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Started</Th>
                        <Th>Ended</Th>
                        <Th>Duration</Th>
                        <Th w="40%">Generators</Th>
                        <Th>Posts</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {runs.map(run => {
                        const key = new Date(run.startedAt).getTime();
                        const errList = errors[key];
                        return (
                            <React.Fragment key={key}>
                                <Tr>
                                    <Td>
                                        {new Date(
                                            run.startedAt,
                                        ).toLocaleString()}
                                    </Td>
                                    <Td>
                                        {run.endedAt
                                            ? new Date(
                                                  run.endedAt,
                                              ).toLocaleString()
                                            : ""}
                                    </Td>
                                    <Td>{formatDuration(run)}</Td>
                                    <Td>
                                        <RunProgressBar
                                            successCount={run.successCount}
                                            failCount={run.failCount}
                                            total={run.numGenerators}
                                        />
                                    </Td>
                                    <Td>{run.postCount}</Td>
                                </Tr>
                                {errList && errList.length > 0 && (
                                    <Tr>
                                        <Td colSpan={5} p={0}>
                                            <Accordion allowToggle>
                                                <AccordionItem border="0">
                                                    <h2>
                                                        <AccordionButton>
                                                            <Box
                                                                flex="1"
                                                                textAlign="left"
                                                            >
                                                                Errors (
                                                                {errList.length}
                                                                )
                                                            </Box>
                                                            <AccordionIcon />
                                                        </AccordionButton>
                                                    </h2>
                                                    <AccordionPanel pb={4}>
                                                        {errList.map(e => (
                                                            <Box
                                                                key={e.id}
                                                                mb={4}
                                                            >
                                                                <Text
                                                                    fontWeight="bold"
                                                                    mb={1}
                                                                >
                                                                    {e.name}
                                                                </Text>
                                                                <Text whiteSpace="pre-wrap">
                                                                    {e.error}
                                                                </Text>
                                                            </Box>
                                                        ))}
                                                    </AccordionPanel>
                                                </AccordionItem>
                                            </Accordion>
                                        </Td>
                                    </Tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </Tbody>
            </Table>
        </Box>
    );
}
