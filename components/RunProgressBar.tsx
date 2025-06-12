import { Box, Center, HStack } from "@chakra-ui/react";
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
        <HStack w="full" gap={0} h="6" borderRadius="sm" overflow="hidden">
            {successPct > 0 && (
                <Box bg="green.500" w={`${successPct}%`} h="full">
                    <Center>{successCount}</Center>
                </Box>
            )}
            {failPct > 0 && (
                <Box bg="red.500" w={`${failPct}%`} h="full">
                    <Center>{failCount}</Center>
                </Box>
            )}
            {pendingPct > 0 && (
                <Box
                    bg="gray.300"
                    _dark={{ bg: "gray.600" }}
                    w={`${pendingPct}%`}
                    h="full"
                >
                    <Center>{total - successCount - failCount}</Center>
                </Box>
            )}
        </HStack>
    );
}
