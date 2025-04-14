import { ActionIcon, Avatar, Badge, Divider, Group, Indicator, ScrollArea, Text, TextInput, Tooltip } from "@mantine/core";
import {
    IconBell,
    IconHash,
    IconInfoCircle,
    IconPin,
    IconSearch,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import { useState } from "react";

import styles from "./channel-header.module.css";

type ChannelHeaderProps = {
    channelName: string;
    channelTopic?: string;
    memberCount?: number;
    onlineCount?: number;
    onToggleMembersList: () => void;
    membersListVisible: boolean;
    connectionStatus?: string;
};

export function ChannelHeader({
    channelName,
    channelTopic = "",
    onToggleMembersList,
    membersListVisible,
    connectionStatus,
}: ChannelHeaderProps) {
    return (
        <div className={styles.container}>
            <Group gap="xs" className={styles.channelInfo}>
                <IconHash size={24} className={styles.hashIcon} />
                <Text fw={600} size="lg">{channelName}</Text>

                <Divider orientation="vertical" className={styles.divider} />

                {channelTopic && (
                    <Text c="dimmed" lineClamp={1} className={styles.topic}>
                        {channelTopic}
                    </Text>
                )}

                {connectionStatus && (
                    <Badge
                        size="sm"
                        variant="light"
                        color={connectionStatus.includes("Connected") ? "green" : "orange"}
                    >
                        {connectionStatus}
                    </Badge>
                )}
            </Group>

            <Group gap="sm" className={styles.actions}>
                <Tooltip label={membersListVisible ? "Hide members" : "Show members"}>
                    <ActionIcon
                        variant="subtle"
                        color={membersListVisible ? "brand-orange" : "gray"}
                        onClick={onToggleMembersList}
                    >
                        <IconUsers size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Search">
                    <ActionIcon variant="subtle" color="gray">
                        <IconSearch size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Notifications">
                    <ActionIcon variant="subtle" color="gray">
                        <IconBell size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Pinned messages">
                    <ActionIcon variant="subtle" color="gray">
                        <IconPin size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Channel information">
                    <ActionIcon variant="subtle" color="gray">
                        <IconInfoCircle size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </div>
    );
}
