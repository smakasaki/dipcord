import type { TaskStatus } from "#/shared/api/tasks/types";

import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth";
import { useCallback } from "react";

import { useTaskActions, useTaskPermissions, useTasksByStatus } from "../model";
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
    const { updateTaskStatus } = useTaskActions();
    const { canChangeTaskStatus } = useTaskPermissions();

    // Handle drag-and-drop to change task status
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, taskId: string, currentStatus: TaskStatus) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.setData("currentStatus", currentStatus);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();

        const taskId = e.dataTransfer.getData("taskId");
        const currentStatus = e.dataTransfer.getData("currentStatus") as TaskStatus;

        // Don't do anything if dropping in the same column
        if (currentStatus === newStatus)
            return;

        // Find the task in the original status column to get its assignedToUserId
        const task = tasksByStatus[currentStatus]?.find(t => t.id === taskId);

        if (task) {
            const userId = useAuthStore.getState().user?.id;
            const userRoles = useAuthStore.getState().user?.roles || [];
            const isAdminOrModerator = userRoles.some(role => ["admin", "moderator"].includes(role));

            // Allow both assignees and task creators to change status
            const canChange = canChangeTaskStatus(task.assignedToUserId)
                || task.createdByUserId === userId
                || isAdminOrModerator;

            if (canChange) {
                updateTaskStatus(taskId, newStatus);
            }
        }
    }, [tasksByStatus, updateTaskStatus, canChangeTaskStatus]);

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
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, typedStatus)}
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
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, task.id, typedStatus)}
                                        style={{ cursor: canChangeTaskStatus(task.assignedToUserId) ? "grab" : "default" }}
                                    >
                                        <TaskCard task={task} />
                                    </div>
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
