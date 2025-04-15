import { ActionIcon, Avatar, Group, Indicator, ScrollArea, Text, TextInput } from "@mantine/core";
import { useState } from "react";

import styles from "./members-sidebar.module.css";

type ChannelMember = {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
};

type MembersSidebarProps = {
    members: ChannelMember[];
    onClose: () => void;
};

export function MembersSidebar({ members, onClose }: MembersSidebarProps) {
    const onlineMembers = members.filter(member => member.isOnline);
    const offlineMembers = members.filter(member => !member.isOnline);

    return (
        <div className={styles.container}>
            <ScrollArea className={styles.membersList} scrollbarSize={8}>
                {onlineMembers.length > 0 && (
                    <>
                        <Text className={styles.categoryLabel} c="dimmed" size="xs">
                            ONLINE —
                            {" "}
                            {onlineMembers.length}
                        </Text>
                        {onlineMembers.map(member => (
                            <Group key={member.id} className={styles.memberItem} gap="sm">
                                <Indicator
                                    inline
                                    position="bottom-end"
                                    offset={7}
                                    size={12}
                                    color="green"
                                    withBorder
                                    processing
                                >
                                    <Avatar
                                        src={member.avatar}
                                        radius="xl"
                                        size="md"
                                    />
                                </Indicator>
                                <Text size="sm">{member.name}</Text>
                            </Group>
                        ))}
                    </>
                )}

                {offlineMembers.length > 0 && (
                    <>
                        <Text className={styles.categoryLabel} c="dimmed" size="xs" mt="md">
                            OFFLINE —
                            {" "}
                            {offlineMembers.length}
                        </Text>
                        {offlineMembers.map(member => (
                            <Group key={member.id} className={styles.memberItem} gap="sm">
                                <Indicator
                                    inline
                                    position="bottom-end"
                                    offset={7}
                                    size={12}
                                    color="gray"
                                    withBorder
                                    disabled
                                >
                                    <Avatar
                                        src={member.avatar}
                                        radius="xl"
                                        size="md"
                                        style={{ filter: "grayscale(100%)" }}
                                    />
                                </Indicator>
                                <Text size="sm" c="dimmed">{member.name}</Text>
                            </Group>
                        ))}
                    </>
                )}
            </ScrollArea>
        </div>
    );
}
