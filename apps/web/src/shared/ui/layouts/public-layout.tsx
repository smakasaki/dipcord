import { Box } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import { Footer } from "#/widgets/footer/ui";
import { Header } from "#/widgets/header/ui";

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
