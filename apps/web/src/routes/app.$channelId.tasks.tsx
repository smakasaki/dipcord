import { Badge, Button, Checkbox, Container, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$channelId/tasks")({
    component: ChannelTasksPage,
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

// Mock tasks
const tasks = [
    { id: 1, title: "Finish project proposal", completed: false, assignee: "Maria K.", priority: "High", dueDate: "Tomorrow" },
    { id: 2, title: "Review code changes", completed: true, assignee: "Alex S.", priority: "Medium", dueDate: "Today" },
    { id: 3, title: "Set up team meeting", completed: false, assignee: "John D.", priority: "Low", dueDate: "Next week" },
    { id: 4, title: "Update documentation", completed: false, assignee: "Sarah C.", priority: "Medium", dueDate: "Friday" },
    { id: 5, title: "Create presentation slides", completed: false, assignee: "Robert L.", priority: "High", dueDate: "Thursday" },
];

function ChannelTasksPage() {
    const { channelId } = Route.useParams();
    const channel = channelsMockdata.find(c => c.id === channelId);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "red";
            case "Medium": return "yellow";
            case "Low": return "teal";
            default: return "gray";
        }
    };

    return (
        <Container fluid>
            <Title order={2} mb="lg">
                {channel.name}
                {" "}
                Channel - Tasks
            </Title>

            <Paper p="md" withBorder>
                <Group mb="xl">
                    <TextInput placeholder="Add a new task..." style={{ flex: 1 }} />
                    <Button leftSection={<IconPlus size={16} />}>Add Task</Button>
                </Group>

                <Stack>
                    {tasks.map(task => (
                        <Paper key={task.id} withBorder p="sm" style={{ opacity: task.completed ? 0.7 : 1 }}>
                            <Group>
                                <Checkbox checked={task.completed} />
                                <div style={{ flex: 1 }}>
                                    <Text style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                                        {task.title}
                                    </Text>
                                    <Group mt={4}>
                                        <Text size="xs" c="dimmed">
                                            Assigned to:
                                            {task.assignee}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Due:
                                            {task.dueDate}
                                        </Text>
                                        <Badge color={getPriorityColor(task.priority)} size="sm">{task.priority}</Badge>
                                    </Group>
                                </div>
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            </Paper>
        </Container>
    );
}
