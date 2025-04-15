import { Badge, Button, Container, Group, Paper, Progress, Radio, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$channelId/polls")({
    component: ChannelPollsPage,
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

// Mock polls
const polls = [
    {
        id: 1,
        title: "What project should we prioritize next?",
        options: [
            { id: "a", text: "Mobile app redesign", votes: 5 },
            { id: "b", text: "New landing page", votes: 3 },
            { id: "c", text: "API improvements", votes: 8 },
        ],
        totalVotes: 16,
        ended: false,
        createdBy: "John D.",
        expiry: "2 days left",
    },
    {
        id: 2,
        title: "Team lunch preferences",
        options: [
            { id: "a", text: "Italian restaurant", votes: 4 },
            { id: "b", text: "Sushi bar", votes: 7 },
            { id: "c", text: "Mexican grill", votes: 2 },
            { id: "d", text: "Salad place", votes: 1 },
        ],
        totalVotes: 14,
        ended: false,
        createdBy: "Maria K.",
        expiry: "1 day left",
    },
    {
        id: 3,
        title: "Best meeting time",
        options: [
            { id: "a", text: "Morning (9-10 AM)", votes: 6 },
            { id: "b", text: "Afternoon (2-3 PM)", votes: 4 },
            { id: "c", text: "Evening (4-5 PM)", votes: 2 },
        ],
        totalVotes: 12,
        ended: true,
        createdBy: "Alex S.",
        expiry: "Ended",
    },
];

function ChannelPollsPage() {
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
                Channel - Polls
            </Title>

            <Group justify="flex-end" mb="md">
                <Button>Create New Poll</Button>
            </Group>

            <Stack>
                {polls.map(poll => (
                    <Paper key={poll.id} withBorder p="md" mb="md">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>{poll.title}</Title>
                            <Group gap="xs">
                                <Badge color={poll.ended ? "gray" : "green"}>
                                    {poll.ended ? "Ended" : "Active"}
                                </Badge>
                                <Text size="xs" c="dimmed">{poll.expiry}</Text>
                            </Group>
                        </Group>

                        <Stack gap="xs" mb="md">
                            {poll.options.map(option => (
                                <div key={option.id}>
                                    <Group justify="space-between" mb={4}>
                                        <Group>
                                            {!poll.ended && <Radio value={option.id} />}
                                            <Text>{option.text}</Text>
                                        </Group>
                                        <Text size="sm" fw={500}>
                                            {option.votes}
                                            {" "}
                                            votes
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={(option.votes / poll.totalVotes) * 100}
                                        color={option.id === "a" ? "brand-orange" : option.id === "b" ? "blue" : option.id === "c" ? "teal" : "violet"}
                                        size="sm"
                                        mb="xs"
                                    />
                                </div>
                            ))}
                        </Stack>

                        <Group justify="space-between" mt="md">
                            <Text size="sm" c="dimmed">
                                Created by
                                {poll.createdBy}
                            </Text>
                            <Text size="sm" c="dimmed">
                                Total votes:
                                {poll.totalVotes}
                            </Text>
                        </Group>

                        {!poll.ended && (
                            <Button variant="light" fullWidth mt="md">
                                Submit Vote
                            </Button>
                        )}
                    </Paper>
                ))}
            </Stack>
        </Container>
    );
}
