/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";

import { ChannelChatPage } from "../../pages/channel-chat";

export const Route = createFileRoute("/channel/$channelId")({
    component: ChannelPage,
});

function ChannelPage() {
    const { channelId } = Route.useParams();
    return <ChannelChatPage channelId={channelId} />;
}
