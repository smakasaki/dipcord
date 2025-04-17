import type { DailyCall } from "@daily-co/daily-js";
import type { ActiveCall } from "#/entities/call";

import DailyIframe from "@daily-co/daily-js";
import { ActionIcon, Avatar, Badge, Button, Card, Group, Indicator, Stack, Text, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconMicrophoneOff, IconPhone, IconPhoneOff, IconVideo } from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth/model/store";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { useState } from "react";

type ActiveCallCardProps = {
    call: ActiveCall;
    onJoin: () => void;
    onEnd?: () => void;
};

export function ActiveCallCard({ call, onJoin, onEnd }: ActiveCallCardProps) {
    const [_callFrame, setCallFrame] = useState<DailyCall | null>(null);
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();

    // Access the current user from auth store
    const currentUser = useAuthStore(state => state.user);

    // Calculate duration from start time until now
    const startTime = new Date(call.startTime);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    const duration = diffHours > 0
        ? `${diffHours} hr ${remainingMins} min`
        : `${diffMins} min`;

    const isCurrentUserInCall = call.participants.some(p => p.id === currentUser?.id);

    // Handle joining the call
    const handleJoinCall = () => {
        if (!currentUser)
            return;

        // Create Daily iframe with styling and theme based on Mantine theme
        const frame = DailyIframe.createFrame({
            showLeaveButton: true,
            showFullscreenButton: true,
            iframeStyle: {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                zIndex: "999",
            },
            theme: {
                colors:
                     {
                         // Dark theme colors
                         accent: theme.colors["brand-orange"]?.[7] || "#f06418",
                         accentText: "#FFFFFF",
                         background: theme.colors.dark[8],
                         backgroundAccent: theme.colors.dark[6],
                         baseText: theme.colors.gray[0],
                         border: theme.colors.dark[5],
                         mainAreaBg: theme.colors.dark[9],
                         mainAreaBgAccent: theme.colors.dark[7],
                         mainAreaText: "#FFFFFF",
                         supportiveText: theme.colors.gray[5],
                     },

            },
        });

        // Prepare user info from auth store
        const userName = `${currentUser.name} ${currentUser.surname}`;
        const userAvatar = currentUser.avatar || getUserAvatarUrl(currentUser.id);

        // Join the room with user information
        frame.join({
            url: "https://smakasaki.daily.co/test-room",
            userName,
            userData: {
                avatar: userAvatar,
            },
        });

        setCallFrame(frame);

        // Call the provided onJoin callback
        onJoin();

        // Setup event handlers for when the call ends
        frame.on("left-meeting", () => {
            frame.destroy();
            setCallFrame(null);
        });
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
            <Group justify="apart" mb="md">
                <Group>
                    <Badge
                        color="green"
                        variant="filled"
                        size="lg"
                        leftSection={
                            call.type === "video"
                                ? <IconVideo size={14} />
                                : <IconPhone size={14} />
                        }
                        style={{ color: "white" }}
                    >
                        Active Call
                    </Badge>
                    <Text fw={500} size="lg">{call.title}</Text>
                </Group>
                <Text color="dimmed" size="sm">
                    Duration:
                    {" "}
                    {duration}
                </Text>
            </Group>

            <Stack mb="xl">
                <Text fw={500}>
                    Participants (
                    {call.participants.length}
                    ):
                </Text>
                <Group>
                    {call.participants.map(participant => (
                        <div key={participant.id} style={{ position: "relative" }}>
                            <Indicator
                                position="bottom-end"
                                color={participant.isSpeaking ? "green" : "gray"}
                                size={10}
                                withBorder
                                processing={participant.isSpeaking}
                            >
                                <Avatar
                                    src={participant.avatar}
                                    radius="xl"
                                    size="md"
                                    color="brand-orange"
                                    style={{
                                        opacity: participant.isVideoOn ? 1 : 0.7,
                                        filter: participant.isVideoOn ? "none" : "grayscale(50%)",
                                    }}
                                >
                                    {participant.name.substring(0, 2).toUpperCase()}
                                </Avatar>
                            </Indicator>
                            {participant.isMuted && (
                                <ActionIcon
                                    color="red"
                                    radius="xl"
                                    size="xs"
                                    variant="filled"
                                    style={{
                                        position: "absolute",
                                        bottom: -2,
                                        left: -2,
                                        zIndex: 2,
                                    }}
                                >
                                    <IconMicrophoneOff size={10} />
                                </ActionIcon>
                            )}
                            <Text size="xs" ta="center" mt={5}>
                                {participant.name}
                            </Text>
                        </div>
                    ))}
                </Group>
            </Stack>

            <Group justify="apart">
                {!isCurrentUserInCall
                    ? (
                            <Button
                                onClick={handleJoinCall}
                                leftSection={call.type === "video" ? <IconVideo size={20} /> : <IconPhone size={20} />}
                                fullWidth
                                color="green"
                                style={{ color: "white" }}
                            >
                                Join Call
                            </Button>
                        )
                    : (
                            <>
                                <Button
                                    onClick={handleJoinCall}
                                    color="blue"
                                    leftSection={call.type === "video" ? <IconVideo size={20} /> : <IconPhone size={20} />}
                                >
                                    Return to Call
                                </Button>
                                {onEnd && (
                                    <Button
                                        onClick={onEnd}
                                        color="red"
                                        leftSection={<IconPhoneOff size={20} />}
                                    >
                                        End Call for Everyone
                                    </Button>
                                )}
                            </>
                        )}
            </Group>
        </Card>
    );
}
