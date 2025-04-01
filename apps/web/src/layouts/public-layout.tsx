import { Box } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";

import { Footer } from "../components/footer";
import { Header } from "../components/header";

export function PublicLayout() {
    return (
        <Box>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </Box>
    );
}

export default PublicLayout;
