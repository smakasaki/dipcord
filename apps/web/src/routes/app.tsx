import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChannelNavbar } from "#/features/channel-navigation";
import { useFetchUserChannels } from "#/features/channels";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({
    component: AppLayout,
});

function AppLayout() {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const { getUserChannels } = useFetchUserChannels();

    useEffect(() => {
        getUserChannels();
    }, [getUserChannels]);

    return (
        <AppShell
            header={{ height: 0 }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { mobile: !mobileOpened, desktop: false },
            }}
        >
            <AppShell.Header>
                <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 1rem" }}>
                    <Burger
                        opened={mobileOpened}
                        onClick={toggleMobile}
                        hiddenFrom="sm"
                        size="sm"
                    />
                    <div style={{ marginLeft: "1rem" }}>Dipcord</div>
                </div>
            </AppShell.Header>

            <AppShell.Navbar p={0}>
                <ChannelNavbar />
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
