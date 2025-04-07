import { Button, Container, Group, Paper, ScrollArea, Text, TextInput, Title } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$channelId/chat")({
    component: ChannelChatPage,
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

// Mock messages
const messages = [
    { id: 1, author: "Alex Kim", content: "Hey everyone! Welcome to the channel.", time: "9:15 AM" },
    { id: 2, author: "Maria Lopez", content: "Thanks! Excited to be here.", time: "9:18 AM" },
    { id: 3, author: "John Doe", content: "What are we working on today?", time: "9:22 AM" },
    { id: 4, author: "Sarah Chen", content: "I just finished the report we discussed yesterday.", time: "9:25 AM" },
    { id: 5, author: "Alex Kim", content: "Great work, Sarah! Can you share it with the team?", time: "9:27 AM" },
];

function ChannelChatPage() {
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
                Channel - Chat
            </Title>

            <Paper p="md" withBorder style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
                <ScrollArea h="calc(100% - 60px)" mb="md">
                    {messages.map(message => (
                        <div key={message.id} style={{ marginBottom: 16 }}>
                            <Group justify="space-between" mb={4}>
                                <Text fw={500}>{message.author}</Text>
                                <Text size="xs" c="dimmed">{message.time}</Text>
                            </Group>
                            <Text>{message.content}</Text>
                        </div>
                    ))}
                </ScrollArea>

                <Group align="flex-end">
                    <TextInput
                        placeholder="Type your message..."
                        style={{ flex: 1 }}
                    />
                    <Button rightSection={<IconSend size={16} />}>
                        Send
                    </Button>
                </Group>
            </Paper>
        </Container>
    );
}
