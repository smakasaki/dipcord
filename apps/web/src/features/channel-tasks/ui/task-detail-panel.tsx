// src/features/channel-tasks/ui/task-detail-panel.tsx

import type { DateValue } from "@mantine/dates";
import type { CreateTaskRequest, Task, TaskStatus, UpdateTaskRequest } from "#/shared/api/tasks/types";

import {
    Avatar,
    Button,
    Drawer,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCalendar } from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth";
import { useChannelMembersStore } from "#/features/channel-members";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { useEffect, useRef } from "react";

import { useTaskActions, useTaskPermissions } from "../model";

type TaskDetailPanelProps = {
    task?: Task;
    isOpen: boolean;
    onClose: () => void;
    initialStatus?: TaskStatus;
};

// Extended request types for form use
type FormTaskRequest = {
    dueDate: DateValue;
    status?: TaskStatus;
} & Omit<CreateTaskRequest, "dueDate">;

export function TaskDetailPanel({ task, isOpen, onClose, initialStatus = "new" }: TaskDetailPanelProps) {
    const { createTask, updateTask, updateTaskStatus, refreshTasks } = useTaskActions();
    const { canEditTask, canChangeTaskStatus } = useTaskPermissions();
    const { user } = useAuthStore();
    const { members, fetchChannelMembers, getUserInfo } = useChannelMembersStore();

    // Use a ref to track initialization and prevent unnecessary effect runs
    const initialized = useRef(false);
    const isNewTask = !task;
    const prevOpenState = useRef(isOpen);

    // Force fetch members when panel opens if needed
    useEffect(() => {
        if (isOpen && members.length === 0 && task?.channelId) {
            fetchChannelMembers(task.channelId);
        }
    }, [isOpen, members.length, task?.channelId, fetchChannelMembers]);

    // Helper to format member options
    const memberOptions = members.map((member) => {
        const userName = member.user
            ? `${member.user.name} ${member.user.surname}`
            : `User ${member.userId.substring(0, 8)}`;

        return {
            value: member.userId,
            label: userName,
        };
    });

    // Add an "Unassigned" option
    memberOptions.unshift({ value: "", label: "Unassigned" });

    // Determine if the current user can edit this task
    const canEdit = isNewTask || (task && canEditTask(task.createdByUserId, task.assignedToUserId));

    // Determine if the current user can change status - allow both assignee and task creator to change status
    const canChangeStatus = task && (
        canChangeTaskStatus(task.assignedToUserId)
        || task.createdByUserId === user?.id
        || user?.roles?.some(role => ["admin", "moderator"].includes(role))
    );

    // Parse due date from task if it exists
    const parseDueDate = (dateStr?: string | null): DateValue => {
        if (!dateStr)
            return null;

        try {
            // Create a proper Date object
            const date = new Date(dateStr);
            // Check if it's a valid date
            if (Number.isNaN(date.getTime()))
                return null;

            return date;
        }
        catch (error) {
            console.error("Error parsing date:", error);
            return null;
        }
    };

    // Set up form with initial values
    const form = useForm<FormTaskRequest>({
        initialValues: {
            title: "",
            description: "",
            priority: "medium",
            assignedToUserId: "",
            dueDate: null,
            status: isNewTask ? initialStatus : undefined,
        },
        validate: {
            title: (value: string) => value.trim().length === 0 ? "Title is required" : null,
        },
    });

    // Update form when task or isOpen changes
    useEffect(() => {
        // Only update form if isOpen changed from false to true to avoid infinite loops
        if (isOpen && (!prevOpenState.current || !initialized.current)) {
            if (task) {
                form.setValues({
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority,
                    assignedToUserId: task.assignedToUserId || "",
                    dueDate: parseDueDate(task.dueDate),
                    status: task.status,
                });
            }
            else {
                form.setValues({
                    title: "",
                    description: "",
                    priority: "medium",
                    assignedToUserId: user?.id || "",
                    dueDate: null,
                    status: initialStatus,
                });
            }
            initialized.current = true;
        }

        // Update prev state ref
        prevOpenState.current = isOpen;

        // Reset initialization state when drawer closes
        if (!isOpen) {
            initialized.current = false;
        }
    }, [task, isOpen, user?.id, initialStatus]);

    // Handle form submission - ensure date is properly formatted
    const handleSubmit = async (values: FormTaskRequest) => {
        try {
            // Create a new object to avoid mutating the original values
            const submissionValues: CreateTaskRequest | UpdateTaskRequest = {
                ...values,
                // Format date for API
                dueDate: values.dueDate instanceof Date
                    ? values.dueDate.toISOString()
                    : undefined,
            };

            // Remove status from submission values since it's not part of the base types
            const { status, ...apiValues } = submissionValues as any;

            if (isNewTask) {
                // Create new task
                await createTask({
                    ...apiValues,
                    // Include initial status as a separate property for the controller
                    status: initialStatus,
                } as any);
            }
            else if (task) {
                // Update existing task
                await updateTask(task.id, apiValues);

                // Always update status if it's different from current and user has permission
                if (status && task.status !== status && canChangeStatus) {
                    await updateTaskStatus(task.id, status);
                }
            }

            // Refresh tasks to update UI
            await refreshTasks();

            // Close the panel on success
            onClose();
        }
        catch (error) {
            console.error("Error saving task:", error);
            // You could add error handling/display here
        }
    };

    // Get creator info if available
    const createdByInfo = task?.createdByUserId
        ? members.find(m => m.userId === task.createdByUserId)?.user
        : null;

    const creatorName = createdByInfo
        ? `${createdByInfo.name} ${createdByInfo.surname}`
        : task?.createdByUserId
            ? `User ${task.createdByUserId.substring(0, 8)}`
            : "Unknown";

    // Get creator avatar
    const creatorAvatarUrl = task?.createdByUserId
        ? getUserInfo(task.createdByUserId)?.avatar || getUserAvatarUrl(task.createdByUserId)
        : null;

    const formattedCreationDate = task?.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : "";

    // Get assignee info for avatar
    const assigneeId = form.values.assignedToUserId;
    const assigneeAvatarUrl = assigneeId
        ? getUserInfo(assigneeId)?.avatar || getUserAvatarUrl(assigneeId)
        : null;

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            position="right"
            title={isNewTask ? "New Task" : "Task Details"}
            padding="lg"
            size="md"
            overlayProps={{ opacity: 0.5, blur: 4 }}
            closeButtonProps={{ size: "md" }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        placeholder="Task title"
                        required
                        {...form.getInputProps("title")}
                        disabled={!canEdit}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Task description"
                        minRows={3}
                        {...form.getInputProps("description")}
                        disabled={!canEdit}
                    />

                    <Select
                        label="Priority"
                        data={[
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                        ]}
                        {...form.getInputProps("priority")}
                        disabled={!canEdit}
                    />

                    {/* Task status selector - show for all tasks */}
                    <Select
                        label="Status"
                        data={[
                            { value: "new", label: "New" },
                            { value: "in_progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                        ]}
                        {...form.getInputProps("status")}
                        disabled={!isNewTask && !canChangeStatus}
                    />

                    <Select
                        label="Assignee"
                        placeholder="Select assignee"
                        data={memberOptions}
                        {...form.getInputProps("assignedToUserId")}
                        disabled={!canEdit}
                        clearable
                        leftSection={assigneeAvatarUrl
                            ? <Avatar src={assigneeAvatarUrl} size="sm" radius="xl" />
                            : undefined}
                    />

                    <DatePickerInput
                        label="Due Date"
                        placeholder="Select due date"
                        value={form.values.dueDate}
                        onChange={date => form.setFieldValue("dueDate", date)}
                        clearable
                        disabled={!canEdit}
                        leftSection={<IconCalendar size={16} />}
                    />

                    {task && (
                        <Group>
                            {creatorAvatarUrl && (
                                <Avatar
                                    src={creatorAvatarUrl}
                                    size="sm"
                                    radius="xl"
                                />
                            )}
                            <Text size="sm" c="dimmed">
                                Created by
                                {" "}
                                {creatorName}
                                {" "}
                                on
                                {" "}
                                {formattedCreationDate}
                            </Text>
                        </Group>
                    )}

                    {canEdit && (
                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={onClose}>Cancel</Button>
                            <Button type="submit">{isNewTask ? "Create Task" : "Save Changes"}</Button>
                        </Group>
                    )}
                </Stack>
            </form>
        </Drawer>
    );
}
