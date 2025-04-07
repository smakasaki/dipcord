import { ActionIcon, Avatar, Button, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconMicrophone, IconMicrophoneOff, IconPhone, IconPhoneOff, IconScreenShare, IconVideo } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$channelId/calls")({
    component: ChannelCallsPage,
});

const channelsMockdata = [
    { id: "1", name: "General", color: "brand-orange" },
    { id: "2", name: "Marketing", color: "brand-orange" },
    { id: "3", name: "Development", color: "brand-orange" },
    { id: "4", name: "Design", color: "brand-orange" },
    { id: "5", name: "Sales", color: "brand-orange" },
    { id: "6", name: "Support", color: "brand-orange" },
    { id: "7", name: "HR", color: "brand-orange" },
    { id: "8", name: "Finance", color: "brand-orange" },
    { id: "9", name: "Research", color: "brand-orange" },
    { id: "10", name: "Operations", color: "brand-orange" },
];

// Mock call history
const callHistory = [
    { id: 1, type: "video", participants: 4, duration: "45 minutes", date: "Today, 10:30 AM", initiatedBy: "John D." },
    { id: 2, type: "audio", participants: 3, duration: "22 minutes", date: "Yesterday, 3:15 PM", initiatedBy: "Maria K." },
    { id: 3, type: "video", participants: 6, duration: "1 hour 10 minutes", date: "Jan 15, 2023", initiatedBy: "Alex S." },
    { id: 4, type: "audio", participants: 2, duration: "15 minutes", date: "Jan 12, 2023", initiatedBy: "You" },
];

// Active participants mock
const activeParticipants = [
    { id: 1, name: "Maria Kim", avatar: "MK", speaking: true, muted: false },
    { id: 2, name: "Alex Smith", avatar: "AS", speaking: false, muted: true },
    { id: 3, name: "John Doe", avatar: "JD", speaking: false, muted: false },
    { id: 4, name: "You", avatar: "YO", speaking: false, muted: false },
];

function ChannelCallsPage() {
    const { channelId } = Route.useParams();
    const channel = channelsMockdata.find(c => c.id === channelId);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

    return (
        <Container fluid>
            <Title order={2} mb="lg">
                {channel.name}
                {" "}
                Channel - Calls
            </Title>

            <Paper withBorder p="md" mb="xl">
                <Group justify="space-between" mb="md">
                    <Title order={4}>Start a New Call</Title>
                </Group>

                <Group>
                    <Button leftSection={<IconPhone size={16} />} variant="outline">
                        Audio Call
                    </Button>
                    <Button leftSection={<IconVideo size={16} />} variant="filled" color="brand-orange">
                        Video Call
                    </Button>
                </Group>
            </Paper>

            <Paper withBorder p="md" mb="xl">
                <Title order={4} mb="md">Active Call</Title>

                <Text mb="lg">Call in progress - 25 minutes</Text>

                <Group style={{ flexWrap: "wrap" }} mb="xl">
                    {activeParticipants.map(participant => (
                        <Paper key={participant.id} withBorder p="xs" style={{ width: "48%", margin: "0.5%" }}>
                            <Group justify="space-between">
                                <Group>
                                    <Avatar color="brand-orange" radius="xl">{participant.avatar}</Avatar>
                                    <div>
                                        <Text>{participant.name}</Text>
                                        <Text size="xs" c={participant.speaking ? "brand-orange" : "dimmed"}>
                                            {participant.speaking ? "Speaking" : participant.muted ? "Muted" : "Not speaking"}
                                        </Text>
                                    </div>
                                </Group>
                                {participant.name === "You"
                                    ? null
                                    : (
                                            <ActionIcon variant="subtle">
                                                {participant.muted ? <IconMicrophoneOff size={16} /> : <IconMicrophone size={16} />}
                                            </ActionIcon>
                                        )}
                            </Group>
                        </Paper>
                    ))}
                </Group>

                <Group justify="center">
                    <ActionIcon color="brand-orange" variant="light" size="lg">
                        <IconMicrophone size={20} />
                    </ActionIcon>
                    <ActionIcon color="brand-orange" variant="light" size="lg">
                        <IconVideo size={20} />
                    </ActionIcon>
                    <ActionIcon color="brand-orange" variant="light" size="lg">
                        <IconScreenShare size={20} />
                    </ActionIcon>
                    <ActionIcon color="red" variant="filled" size="lg">
                        <IconPhoneOff size={20} />
                    </ActionIcon>
                </Group>
            </Paper>

            <Title order={4} mb="md">Recent Calls</Title>

            <Stack>
                {callHistory.map(call => (
                    <Paper key={call.id} withBorder p="md">
                        <Group justify="space-between">
                            <div>
                                <Group>
                                    <ActionIcon variant="light" color={call.type === "video" ? "blue" : "grape"}>
                                        {call.type === "video" ? <IconVideo size={16} /> : <IconPhone size={16} />}
                                    </ActionIcon>
                                    <div>
                                        <Text>
                                            {call.type === "video" ? "Video" : "Audio"}
                                            {" "}
                                            call with
                                            {call.participants}
                                            {" "}
                                            participants
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {call.date}
                                            {" "}
                                            •
                                            {call.duration}
                                            {" "}
                                            • Started by
                                            {call.initiatedBy}
                                        </Text>
                                    </div>
                                </Group>
                            </div>
                            <Button variant="light" size="xs">View Details</Button>
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </Container>
    );
}
