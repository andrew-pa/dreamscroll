"use client";
import {
    ProgressCircle,
    IconButton,
    Popover,
    AbsoluteCenter,
    Portal,
} from "@chakra-ui/react";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import useSWR from "swr";
import type { WorkerRunRecord } from "@/lib/repositories";
import { WorkerRunPopoverContent } from "./WorkerRunPopoverContent";
import { workerRunRecordFromJson } from "@/lib/repositories/workerRunRepository";

const fetcher = (url: string) =>
    fetch(url)
        .then(r => r.json())
        .then(workerRunRecordFromJson);

interface Props {
    display?: Record<string, string>;
}

export default function WorkerStatusIndicator({ display }: Props) {
    const { data } = useSWR<WorkerRunRecord | null>(
        "/api/worker-runs/latest",
        fetcher,
        { refreshInterval: 30000 },
    );
    const run = data ?? null;

    let value = 0;
    let label: React.ReactNode = null;

    if (run) {
        if (run.endedAt) {
            value = 100;
            label = run.failCount > 0 ? <FiAlertCircle /> : <FiCheck />;
        } else {
            value =
                ((run.successCount + run.failCount) / run.numGenerators) * 100;
        }
    }

    return (
        <Popover.Root positioning={{ placement: "bottom-start" }}>
            <Popover.Trigger asChild>
                <IconButton
                    aria-label="Worker status"
                    variant="ghost"
                    size="md"
                    minW="40px"
                    display={display}
                >
                    <ProgressCircle.Root value={value} size="xs">
                        <ProgressCircle.Circle css={{ "--thickness": "2px" }}>
                            <ProgressCircle.Track />
                            <ProgressCircle.Range />
                        </ProgressCircle.Circle>
                        {label && <AbsoluteCenter>{label}</AbsoluteCenter>}
                    </ProgressCircle.Root>
                </IconButton>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content w="xs">
                        <Popover.Arrow />
                        <Popover.Body>
                            <WorkerRunPopoverContent run={run} />
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}
