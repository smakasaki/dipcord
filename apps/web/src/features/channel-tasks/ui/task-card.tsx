// src/features/channel-tasks/ui/task-card.tsx

import type { Task } from "#/shared/api/tasks/types";

import { ActionIcon, Avatar, Badge, Card, Group, Menu, Text, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconCalendar, IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth";
import { useChannelMembersStore } from "#/features/channel-members";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { formatRelativeDate } from "#/shared/lib/date";
import { memo } from "react";

import { useTaskActions, useTaskPermissions } from "../model";

type TaskCardProps = {
    task: Task;
};

export const TaskCard = memo(({ task }: TaskCardProps) => {
    const { selectTask, updateTaskStatus, deleteTask, refreshTasks } = useTaskActions();
    const { canEditTask, canDeleteTask, canChangeTaskStatus } = useTaskPermissions();
    const { getUserInfo } = useChannelMembersStore();

    // Get user info for the assignee
    const assigneeInfo = task.assignedToUserId ? getUserInfo(task.assignedToUserId) : null;
    const assigneeName = assigneeInfo
        ? `${assigneeInfo.name} ${assigneeInfo.surname}`
        : task.assignedToUserId
            ? "Unknown User"
            : "Unassigned";

    // Get assignee avatar
    const assigneeAvatarUrl = task.assignedToUserId
        ? assigneeInfo?.avatar || getUserAvatarUrl(task.assignedToUserId)
        : null;

    // Get formatted date
    const formattedDueDate = task.dueDate ? formatRelativeDate(new Date(task.dueDate)) : "No due date";

    // Priority badge color
    const priorityColor = task.priority === "high"
        ? "red"
        : task.priority === "medium"
            ? "orange"
            : "green";

    // Check permissions for this task
    const canEdit = canEditTask(task.createdByUserId, task.assignedToUserId);
    const canDelete = canDeleteTask(task.createdByUserId);
    const canChangeStatus = canChangeTaskStatus(task.assignedToUserId)
        || task.createdByUserId === useAuthStore.getState().user?.id
        || useAuthStore.getState().user?.roles?.some(role => ["admin", "moderator"].includes(role));

    // Handle status change
    const handleMoveToStatus = async (newStatus: "new" | "in_progress" | "completed") => {
        if (canChangeStatus && task.status !== newStatus) {
            await updateTaskStatus(task.id, newStatus);
        }
    };

    // Handle task deletion
    const handleDelete = async () => {
        if (canDelete) {
            await deleteTask(task.id);
            await refreshTasks();
        }
    };

    return (
        <Card
            shadow="sm"
            padding="md"
            radius="md"
            withBorder
            style={{ marginBottom: 10 }}
            onClick={() => selectTask(task.id)}
        >
            <Group justify="space-between" mb={5}>
                <Group gap="xs">
                    <Badge color={priorityColor} variant="filled" size="sm" c="white">
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Text fw={500} lineClamp={1}>
                        {task.title}
                    </Text>
                </Group>

                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon onClick={e => e.stopPropagation()}>
                            <IconDots size={16} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {canEdit && (
                            <Menu.Item
                                leftSection={<IconEdit size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectTask(task.id);
                                }}
                            >
                                Edit
                            </Menu.Item>
                        )}

                        {canChangeStatus && task.status !== "new" && (
                            <Menu.Item
                                leftSection={<IconArrowLeft size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToStatus("new");
                                }}
                            >
                                Move to New
                            </Menu.Item>
                        )}

                        {canChangeStatus && task.status !== "in_progress" && (
                            <Menu.Item
                                leftSection={task.status === "new" ? <IconArrowRight size={16} /> : <IconArrowLeft size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToStatus("in_progress");
                                }}
                            >
                                Move to In Progress
                            </Menu.Item>
                        )}

                        {canChangeStatus && task.status !== "completed" && (
                            <Menu.Item
                                leftSection={<IconArrowRight size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToStatus("completed");
                                }}
                            >
                                Move to Completed
                            </Menu.Item>
                        )}

                        {canDelete && (
                            <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                            >
                                Delete
                            </Menu.Item>
                        )}
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Group justify="space-between" mt="xs">
                <Group gap={6} wrap="nowrap">
                    {assigneeAvatarUrl && (
                        <Avatar
                            src={assigneeAvatarUrl}
                            size="xs"
                            radius="xl"
                        />
                    )}
                    <Text c="dimmed" size="sm">
                        {assigneeName}
                    </Text>
                </Group>

                <Tooltip label={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}>
                    <Group gap={4}>
                        <IconCalendar size={14} />
                        <Text size="xs" c={task.dueDate && new Date(task.dueDate) < new Date() ? "red" : "dimmed"}>
                            {formattedDueDate}
                        </Text>
                    </Group>
                </Tooltip>
            </Group>
        </Card>
    );
});

TaskCard.displayName = "TaskCard";
