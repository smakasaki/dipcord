import { MantineProvider } from "@mantine/core";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
// Import Mantine styles
import "@mantine/core/styles.css";

export const Route = createRootRoute({
    component: () => (
        <MantineProvider>
            <div className="app-container">
                <Outlet />
                {// eslint-disable-next-line node/no-process-env
                    process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />
                }
            </div>
        </MantineProvider>
    ),
});
