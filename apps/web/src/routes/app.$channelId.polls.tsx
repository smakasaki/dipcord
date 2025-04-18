import { createFileRoute } from "@tanstack/react-router";
import { PollsPage } from "#/pages/channel-polls";

export const Route = createFileRoute("/app/$channelId/polls")({
    component: PollsPage,
});
