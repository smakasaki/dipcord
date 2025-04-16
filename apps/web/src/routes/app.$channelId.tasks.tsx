import { createFileRoute } from "@tanstack/react-router";
import { TaskPage } from "#/pages/channel-tasks";

export const Route = createFileRoute("/app/$channelId/tasks")({
    component: ChannelTasksPage,
});

function ChannelTasksPage() {
    return (
        <TaskPage />
    );
}
