import type { Call } from "#/entities/call";

import { ActionIcon, Avatar, Group, Paper, Text, Tooltip } from "@mantine/core";
import { IconInfoCircle, IconPhone, IconVideo } from "@tabler/icons-react";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { formatCallDuration, formatTimeToNow } from "#/shared/lib/date";

type CallHistoryItemProps = {
    call: Call;
    onClick?: () => void;
};

export function CallHistoryItem({ call, onClick }: CallHistoryItemProps) {
    const duration = call.endTime
        ? formatCallDuration(call.startTime, call.endTime)
        : "In progress";

    const timeAgo = formatTimeToNow(call.startTime);

    return (
        <Paper
            withBorder
            p="md"
            radius="md"
            onClick={onClick}
            style={{ cursor: onClick ? "pointer" : "default" }}
        >
            <Group justify="apart" mb="xs">
                <Group>
                    <Avatar
                        color={call.type === "video" ? "blue" : "grape"}
                        radius="xl"
                    >
                        {call.type === "video" ? <IconVideo size={18} /> : <IconPhone size={18} />}
                    </Avatar>
                    <div>
                        <Text fw={500}>
                            {call.title || `${call.type === "video" ? "Video" : "Audio"} call`}
                        </Text>
                        <Text size="sm" color="dimmed">
                            {timeAgo}
                            {" "}
                            •
                            {duration}
                            {" "}
                            •
                            {call.participants}
                            {" "}
                            participants
                        </Text>
                    </div>
                </Group>
                <Tooltip label="View details">
                    <ActionIcon variant="subtle">
                        <IconInfoCircle size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Group justify="apart" mt="md">
                <Group gap="xs">
                    <Avatar
                        src={getUserAvatarUrl(call.initiatedBy.id)}
                        size="sm"
                        radius="xl"
                    />
                    <Text size="xs" color="dimmed">
                        Started by
                        {" "}
                        {call.initiatedBy.name}
                    </Text>
                </Group>
                {call.recordingUrl && (
                    <Text size="xs" color="blue">
                        Recording available
                    </Text>
                )}
            </Group>
        </Paper>
    );
}
