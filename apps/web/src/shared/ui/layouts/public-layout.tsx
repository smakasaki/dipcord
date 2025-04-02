import { Box } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import { Footer } from "#/widgets/footer/ui";
import { Header } from "#/widgets/header/ui";

import classes from "./public-layout.module.css";

export function PublicLayout() {
    return (
        <Box className={classes.layout}>
            <Header />
            <main className={classes.main}>
                <Outlet />
            </main>
            <Footer />
        </Box>
    );
}
