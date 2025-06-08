"use client";
import {
    CircularProgress,
    CircularProgressLabel,
    IconButton,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import useSWR from "swr";
import type { WorkerRunRecord } from "@/lib/repositories";
import { WorkerRunPopoverContent } from "./WorkerRunPopoverContent";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
    display?: Record<string, string>;
}

export default function WorkerStatusIndicator({ display }: Props) {
    const { data } = useSWR<WorkerRunRecord | null>(
        "/api/worker-runs/latest",
        fetcher,
        { refreshInterval: 30000 },
    );
    const { isOpen, onOpen, onClose } = useDisclosure();
    const run = data ?? null;

    let value = 0;
    let color = "gray.400";
    let label: React.ReactNode = null;

    if (run) {
        if (run.endedAt) {
            value = 100;
            color = run.failCount > 0 ? "red.500" : "green.500";
            label = run.failCount > 0 ? <FiAlertCircle /> : <FiCheck />;
        } else {
            value =
                ((run.successCount + run.failCount) / run.numGenerators) * 100;
            color = "blue.500";
        }
    }

    return (
        <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            placement="bottom-start"
        >
            <PopoverTrigger>
                <IconButton
                    aria-label="Worker status"
                    variant="ghost"
                    size="md"
                    minW="40px"
                    display={display}
                >
                    <CircularProgress value={value} size="24px" color={color}>
                        {label && (
                            <CircularProgressLabel>
                                {label}
                            </CircularProgressLabel>
                        )}
                    </CircularProgress>
                </IconButton>
            </PopoverTrigger>
            <PopoverContent w="xs">
                <PopoverBody>
                    <WorkerRunPopoverContent run={run} />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
}
