import { Container, Title } from "@mantine/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useChannels } from "#/features/channels";
import { useEffect } from "react";

export const Route = createFileRoute("/app/$channelId")({
    component: ChannelPage,
    beforeLoad: ({ params, location }) => {
    // If the base channel route is requested without specifying a tab (chat, tasks, etc.),
    // redirect to the chat tab
        if (location.pathname === `/app/${params.channelId}`) {
            throw redirect({
                to: "/app/$channelId/chat",
                params: { channelId: params.channelId },
            });
        }
    },
});

function ChannelPage() {
    const { channelId } = Route.useParams();
    const channels = useChannels();
    const channel = channels.find(c => c.id === channelId);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

    return (
        <Container fluid>
            <Outlet />
        </Container>
    );
}
