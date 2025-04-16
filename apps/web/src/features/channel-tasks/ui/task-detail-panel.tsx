// src/features/channel-tasks/ui/task-detail-panel.tsx

import type { CreateTaskRequest, Task, TaskStatus, UpdateTaskRequest } from "#/shared/api/tasks/types";

import {
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
import { useEffect, useRef } from "react";

import { useTaskActions, useTaskPermissions } from "../model";

type TaskDetailPanelProps = {
    task?: Task;
    isOpen: boolean;
    onClose: () => void;
    initialStatus?: TaskStatus;
};

export function TaskDetailPanel({ task, isOpen, onClose, initialStatus = "new" }: TaskDetailPanelProps) {
    const { createTask, updateTask } = useTaskActions();
    const { canEditTask } = useTaskPermissions();
    const { user } = useAuthStore();
    const { members } = useChannelMembersStore();

    // Use a ref to track initialization
    const initialized = useRef(false);
    const isNewTask = !task;

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

    // Set up form with initial values
    const form = useForm<CreateTaskRequest | UpdateTaskRequest>({
        initialValues: {
            title: "",
            description: "",
            priority: "medium",
            assignedToUserId: "",
            dueDate: undefined,
        },
        validate: {
            title: (value: string) => value.trim().length === 0 ? "Title is required" : null,
        },
    });

    // Update form when task or isOpen changes
    useEffect(() => {
        // Only update the form when the drawer is open
        if (isOpen) {
            if (task) {
                form.setValues({
                    title: task.title,
                    description: task.description || undefined,
                    priority: task.priority,
                    assignedToUserId: task.assignedToUserId || "",
                    dueDate: task.dueDate || undefined,
                });
            }
            else {
                form.setValues({
                    title: "",
                    description: "",
                    priority: "medium",
                    assignedToUserId: user?.id || "",
                    dueDate: undefined,
                });
            }
            initialized.current = true;
        }
    }, [task, isOpen, user?.id]);

    // Handle form submission
    const handleSubmit = async (values: CreateTaskRequest | UpdateTaskRequest) => {
        try {
            if (isNewTask) {
                // Create new task
                await createTask({
                    ...values as CreateTaskRequest,
                    // Include initial status if provided (API may ignore this)
                    status: initialStatus,
                } as any);
            }
            else if (task) {
                // Update existing task
                await updateTask(task.id, values);
            }

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

    const formattedCreationDate = task?.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : "";

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

                    {!isNewTask && (
                        <Select
                            label="Status"
                            data={[
                                { value: "new", label: "New" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "completed", label: "Completed" },
                            ]}
                            value={task?.status}
                            disabled
                            readOnly
                        />
                    )}

                    <Select
                        label="Assignee"
                        placeholder="Select assignee"
                        data={memberOptions}
                        {...form.getInputProps("assignedToUserId")}
                        disabled={!canEdit}
                        clearable
                    />

                    <DatePickerInput
                        label="Due Date"
                        placeholder="Select due date"
                        {...form.getInputProps("dueDate")}
                        valueFormat="YYYY-MM-DD"
                        clearable
                        disabled={!canEdit}
                        leftSection={<IconCalendar size={16} />}
                    />

                    {task && (
                        <Text size="sm" c="dimmed">
                            Created by
                            {" "}
                            {creatorName}
                            {" "}
                            on
                            {" "}
                            {formattedCreationDate}
                        </Text>
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
