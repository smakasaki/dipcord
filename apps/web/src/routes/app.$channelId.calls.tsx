import { createFileRoute } from "@tanstack/react-router";
import { ChannelCallsPage } from "#/pages/channel-calls";

export const Route = createFileRoute("/app/$channelId/calls")({
    component: ChannelCallsPage,
});
