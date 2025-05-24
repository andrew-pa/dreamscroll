import { ReactNode } from "react";
import { NavBar } from "@/components/NavBar";
import { Box } from "@chakra-ui/react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <NavBar />
            <Box as="main">{children}</Box>
        </>
    );
}
