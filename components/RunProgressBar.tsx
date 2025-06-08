import { Box, HStack } from "@chakra-ui/react";
interface Props {
    successCount: number;
    failCount: number;
    total: number;
}

export function RunProgressBar({ successCount, failCount, total }: Props) {
    const safeTotal = Math.max(total, 1);
    const successPct = (successCount / safeTotal) * 100;
    const failPct = (failCount / safeTotal) * 100;
    const pendingPct = 100 - successPct - failPct;

    return (
        <HStack w="full" h="4" spacing={0} borderRadius="sm" overflow="hidden">
            <Box bg="green.500" w={`${successPct}%`} h="full" />
            <Box bg="red.500" w={`${failPct}%`} h="full" />
            <Box
                bg="gray.300"
                _dark={{ bg: "gray.600" }}
                w={`${pendingPct}%`}
                h="full"
            />
        </HStack>
    );
}
