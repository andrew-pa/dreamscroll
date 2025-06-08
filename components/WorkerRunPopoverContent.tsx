"use client";
import { Stack, Text, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import type { WorkerRunRecord } from "@/lib/repositories";
import { RunProgressBar } from "./RunProgressBar";

function durationMs(start: Date, end: Date) {
    return end.getTime() - start.getTime();
}

function formatDuration(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
}

export function WorkerRunPopoverContent({
    run,
}: {
    run: WorkerRunRecord | null;
}) {
    if (!run) return <Text>No runs yet</Text>;
    const end = run.endedAt ?? new Date();
    const pending = run.numGenerators - run.successCount - run.failCount;
    return (
        <Stack gap={3} fontSize="sm">
            <Text>
                <strong>Started:</strong> {run.startedAt.toLocaleString()}
            </Text>
            <Text>
                <strong>Duration:</strong>{" "}
                {formatDuration(durationMs(run.startedAt, end))}
            </Text>
            <RunProgressBar
                successCount={run.successCount}
                failCount={run.failCount}
                total={run.numGenerators}
            />
            <Text>
                {run.successCount} succeeded, {run.failCount} failed, {pending}{" "}
                pending
            </Text>
            <Text>
                <strong>Posts:</strong> {run.postCount}
            </Text>
            <Link as={NextLink} href="/worker">
                Status History
            </Link>
        </Stack>
    );
}
