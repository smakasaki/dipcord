// src/features/channel-tasks/ui/task-list-view.tsx

import type { Task } from "#/shared/api/tasks/types";

import { ActionIcon, Badge, Group, Menu, Table, Text, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconCalendar, IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { useChannelMembersStore } from "#/features/channel-members";
import { formatRelativeDate } from "#/shared/lib/date";

import { useTaskActions, useTaskPermissions } from "../model";

type TaskListViewProps = {
    tasks: Task[];
};

const StatusIndicator = ({ status }: { status: string }) => {
    let color = "";
    let icon = "○";

    switch (status) {
        case "new":
            color = "blue";
            icon = "○";
            break;
        case "in_progress":
            color = "orange";
            icon = "◐";
            break;
        case "completed":
            color = "green";
            icon = "●";
            break;
    }

    return (
        <Text fw={700} c={color}>{icon}</Text>
    );
};

export function TaskListView({ tasks }: TaskListViewProps) {
    const { selectTask, updateTaskStatus, deleteTask } = useTaskActions();
    const { canEditTask, canDeleteTask, canChangeTaskStatus } = useTaskPermissions();
    const { getUserInfo } = useChannelMembersStore();

    // Handle status change
    const handleMoveToStatus = async (task: Task, newStatus: "new" | "in_progress" | "completed") => {
        if (canChangeTaskStatus(task.assignedToUserId) && task.status !== newStatus) {
            await updateTaskStatus(task.id, newStatus);
        }
    };

    // Handle task deletion
    const handleDelete = async (task: Task) => {
        if (canDeleteTask(task.createdByUserId)) {
            await deleteTask(task.id);
        }
    };

    // Table rows
    const rows = tasks.map((task) => {
        // Get user info for the assignee
        const assigneeInfo = task.assignedToUserId ? getUserInfo(task.assignedToUserId) : null;
        const assigneeName = assigneeInfo
            ? `${assigneeInfo.name} ${assigneeInfo.surname}`
            : task.assignedToUserId
                ? "Unknown User"
                : "Unassigned";

        // Get formatted date
        const formattedDueDate = task.dueDate ? formatRelativeDate(new Date(task.dueDate)) : "—";

        // Priority badge color
        const priorityColor = task.priority === "high"
            ? "red"
            : task.priority === "medium"
                ? "orange"
                : "green";

        // Check permissions for this task
        const canEdit = canEditTask(task.createdByUserId, task.assignedToUserId);
        const canDelete = canDeleteTask(task.createdByUserId);
        const canChangeStatus = canChangeTaskStatus(task.assignedToUserId);

        return (
            <tr key={task.id} style={{ cursor: "pointer" }} onClick={() => selectTask(task.id)}>
                <td><StatusIndicator status={task.status} /></td>
                <td>{task.title}</td>
                <td>
                    <Badge color={priorityColor} variant="filled" size="sm">
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                </td>
                <td>{assigneeName}</td>
                <td>
                    <Tooltip label={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}>
                        <Group gap={4}>
                            <IconCalendar size={14} />
                            <Text size="sm" c={task.dueDate && new Date(task.dueDate) < new Date() ? "red" : "dimmed"}>
                                {formattedDueDate}
                            </Text>
                        </Group>
                    </Tooltip>
                </td>
                <td>
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

                            {task.status !== "new" && canChangeStatus && (
                                <Menu.Item
                                    leftSection={<IconArrowLeft size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToStatus(task, task.status === "in_progress" ? "new" : "in_progress");
                                    }}
                                >
                                    Move to
                                    {" "}
                                    {task.status === "in_progress" ? "New" : "In Progress"}
                                </Menu.Item>
                            )}

                            {task.status !== "completed" && canChangeStatus && (
                                <Menu.Item
                                    leftSection={<IconArrowRight size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToStatus(task, task.status === "new" ? "in_progress" : "completed");
                                    }}
                                >
                                    Move to
                                    {" "}
                                    {task.status === "new" ? "In Progress" : "Completed"}
                                </Menu.Item>
                            )}

                            {canDelete && (
                                <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(task);
                                    }}
                                >
                                    Delete
                                </Menu.Item>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </td>
            </tr>
        );
    });

    return (
        <Table highlightOnHover>
            <thead>
                <tr>
                    <th style={{ width: 40 }}>Status</th>
                    <th>Task Title</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th style={{ width: 60 }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {rows.length > 0
                    ? (
                            rows
                        )
                    : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                                    <Text c="dimmed">No tasks found</Text>
                                </td>
                            </tr>
                        )}
            </tbody>
        </Table>
    );
}
