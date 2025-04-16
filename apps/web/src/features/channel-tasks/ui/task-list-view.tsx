// src/features/channel-tasks/ui/task-list-view.tsx

import type { Task } from "#/shared/api/tasks/types";

import {
    ActionIcon,
    Avatar,
    Badge,
    Group,
    Menu,
    Table,
    Text,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import {
    IconArrowLeft,
    IconArrowRight,
    IconCalendar,
    IconCircle,
    IconCircleCheck,
    IconCircleDashed,
    IconDots,
    IconEdit,
    IconTrash,
} from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth";
import { useChannelMembersStore } from "#/features/channel-members";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { formatRelativeDate } from "#/shared/lib/date";

import { useTaskActions, useTaskPermissions } from "../model";
import classes from "./task-list-view.module.css";

type TaskListViewProps = {
    tasks: Task[];
};

export function TaskListView({ tasks }: TaskListViewProps) {
    const theme = useMantineTheme();
    const { selectTask, updateTaskStatus, deleteTask, refreshTasks } = useTaskActions();
    const { canEditTask, canDeleteTask, canChangeTaskStatus } = useTaskPermissions();
    const { getUserInfo } = useChannelMembersStore();

    // Get status icon and color
    const getStatusInfo = (status: string) => {
        switch (status) {
            case "new":
                return {
                    icon: IconCircle,
                    color: theme.colors.blue[6],
                    label: "New",
                };
            case "in_progress":
                return {
                    icon: IconCircleDashed,
                    color: theme.colors["brand-orange"]?.[6] || theme.colors.orange[6],
                    label: "In Progress",
                };
            case "completed":
                return {
                    icon: IconCircleCheck,
                    color: theme.colors.green[6],
                    label: "Completed",
                };
            default:
                return {
                    icon: IconCircle,
                    color: theme.colors.gray[6],
                    label: "Unknown",
                };
        }
    };

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
            await refreshTasks();
        }
    };

    // Table rows
    const rows = tasks.map((task) => {
        // Get status info
        const statusInfo = getStatusInfo(task.status);
        const StatusIcon = statusInfo.icon;

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
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const formattedDueDate = dueDate ? formatRelativeDate(dueDate) : "—";
        const isOverdue = dueDate && dueDate < new Date() && task.status !== "completed";

        // Priority badge styling
        const priorityInfo = (() => {
            switch (task.priority) {
                case "high":
                    return { color: "red", label: "High" };
                case "medium":
                    return { color: "orange", label: "Medium" };
                case "low":
                    return { color: "green", label: "Low" };
                default:
                    return { color: "gray", label: "Normal" };
            }
        })();

        // Check permissions for this task
        const canEdit = canEditTask(task.createdByUserId, task.assignedToUserId);
        const canDelete = canDeleteTask(task.createdByUserId);
        const canChangeStatus = canChangeTaskStatus(task.assignedToUserId)
            || task.createdByUserId === useAuthStore.getState().user?.id
            || useAuthStore.getState().user?.roles?.some(role => ["admin", "moderator"].includes(role));

        return (
            <Table.Tr
                key={task.id}
                className={classes.taskRow}
                onClick={() => selectTask(task.id)}
            >
                <Table.Td>
                    <Group gap={8}>
                        <StatusIcon size={18} color={statusInfo.color} stroke={1.5} />
                        <Text size="sm" fw={500} c={statusInfo.color}>
                            {statusInfo.label}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text fw={500}>{task.title}</Text>
                </Table.Td>
                <Table.Td>
                    <Badge
                        color={priorityInfo.color}
                        variant="light"
                        size="sm"
                        radius="sm"
                        c="white"
                    >
                        {priorityInfo.label}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap={8} wrap="nowrap">
                        {assigneeAvatarUrl && (
                            <Avatar
                                src={assigneeAvatarUrl}
                                size="xs"
                                radius="xl"
                            />
                        )}
                        <Text size="sm">{assigneeName}</Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    {task.dueDate
                        ? (
                                <Tooltip
                                    label={dueDate?.toLocaleDateString()}
                                    position="bottom"
                                    withArrow
                                >
                                    <Group gap={6} wrap="nowrap">
                                        <IconCalendar size={16} color={isOverdue ? theme.colors.red[6] : undefined} />
                                        <Text
                                            size="sm"
                                            c={isOverdue ? "red" : "dimmed"}
                                            fw={isOverdue ? 500 : 400}
                                        >
                                            {formattedDueDate}
                                        </Text>
                                    </Group>
                                </Tooltip>
                            )
                        : (
                                <Text size="sm" c="dimmed">—</Text>
                            )}
                </Table.Td>
                <Table.Td>
                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon variant="subtle" size="sm" color="gray" className={classes.actionIcon} onClick={e => e.stopPropagation()}>
                                <IconDots size={16} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {canEdit && (
                                <Menu.Item
                                    leftSection={<IconEdit size={16} />}
                                    onClick={(e: React.MouseEvent) => {
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
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleMoveToStatus(task, "new");
                                    }}
                                >
                                    Move to New
                                </Menu.Item>
                            )}

                            {canChangeStatus && task.status !== "in_progress" && (
                                <Menu.Item
                                    leftSection={task.status === "new" ? <IconArrowRight size={16} /> : <IconArrowLeft size={16} />}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleMoveToStatus(task, "in_progress");
                                    }}
                                >
                                    Move to In Progress
                                </Menu.Item>
                            )}

                            {canChangeStatus && task.status !== "completed" && (
                                <Menu.Item
                                    leftSection={<IconArrowRight size={16} />}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleMoveToStatus(task, "completed");
                                    }}
                                >
                                    Move to Completed
                                </Menu.Item>
                            )}

                            {canDelete && (
                                <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleDelete(task);
                                    }}
                                >
                                    Delete
                                </Menu.Item>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Table striped highlightOnHover withTableBorder withColumnBorders className={classes.table}>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th style={{ width: 150 }}>Status</Table.Th>
                    <Table.Th>Task Title</Table.Th>
                    <Table.Th style={{ width: 100 }}>Priority</Table.Th>
                    <Table.Th style={{ width: 150 }}>Assignee</Table.Th>
                    <Table.Th style={{ width: 150 }}>Due Date</Table.Th>
                    <Table.Th style={{ width: 60, textAlign: "center" }}>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0
                    ? (
                            rows
                        )
                    : (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                                    <Text c="dimmed">No tasks found</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
            </Table.Tbody>
        </Table>
    );
}
