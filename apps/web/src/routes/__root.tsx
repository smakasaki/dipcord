import type { MantineColorsTuple } from "@mantine/core";

import { createTheme, MantineProvider } from "@mantine/core";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SocketDebug } from "#/shared/ui/debug-socket";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";

const orangeColor: MantineColorsTuple = [
    "#fff0e4",
    "#ffe0cf",
    "#fac0a1",
    "#f69e6e",
    "#f28043",
    "#f06e27",
    "#f06418",
    "#d6530c",
    "#bf4906",
    "#a73c00",
];

const theme = createTheme({
    colors: {
        "brand-orange": orangeColor,
    },

    primaryColor: "brand-orange",

    // Customize which shade is used for filled variants (defaults are { light: 6, dark: 8 })
    primaryShade: { light: 6, dark: 7 },

    // Enable auto contrast for better text visibility on various color shades
    // autoContrast: true,

    // Optional: Define a default gradient that uses your brand color
    defaultGradient: {
        from: "brand-orange.6",
        to: "brand-orange.8",
        deg: 45,
    },
});

export const Route = createRootRoute({
    component: () => (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <div className="app-container">
                <Outlet />
                {// eslint-disable-next-line node/no-process-env
                    process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />
                }
                {// eslint-disable-next-line node/no-process-env
                    process.env.NODE_ENV !== "production" && <SocketDebug />
                }
            </div>
        </MantineProvider>
    ),
});
