import type { TaskStatus } from "#/shared/api/tasks/types";

import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { useTasksByStatus } from "../model";
import { TaskCard } from "./task-card";

const STATUS_LABELS: Record<TaskStatus, string> = {
    new: "New",
    in_progress: "In Progress",
    completed: "Completed",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    new: "blue",
    in_progress: "orange",
    completed: "green",
};

type TaskKanbanViewProps = {
    onAddTask: (initialStatus: TaskStatus) => void;
};

export function TaskKanbanView({ onAddTask }: TaskKanbanViewProps) {
    const tasksByStatus = useTasksByStatus();

    // Create a column for each status
    const columns = Object.entries(tasksByStatus).map(([status, tasks]) => {
        const typedStatus = status as TaskStatus;

        return (
            <Paper
                key={status}
                p="md"
                radius="md"
                withBorder
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Group justify="space-between" mb="md">
                    <Group gap={8}>
                        <Text size="lg" fw={600} c={STATUS_COLORS[typedStatus]}>
                            {STATUS_LABELS[typedStatus]}
                        </Text>
                        <Text size="sm" c="dimmed">
                            (
                            {tasks.length}
                            )
                        </Text>
                    </Group>
                </Group>

                {/* Task list for this status */}
                <Stack
                    gap="sm"
                    style={{
                        flexGrow: 1,
                        overflowY: "auto",
                        maxHeight: "calc(100vh - 250px)",
                    }}
                >
                    {tasks.length > 0
                        ? (
                                tasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            )
                        : (
                                <Text ta="center" c="dimmed" py="lg">
                                    No tasks in this status
                                </Text>
                            )}
                </Stack>

                {/* Add task button */}
                <Button
                    variant="subtle"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => onAddTask(typedStatus)}
                    fullWidth
                    mt="md"
                >
                    Add Task
                </Button>
            </Paper>
        );
    });

    return (
        <SimpleGrid
            cols={3}
            spacing="md"
            verticalSpacing="md"
        >
            {columns}
        </SimpleGrid>
    );
}
