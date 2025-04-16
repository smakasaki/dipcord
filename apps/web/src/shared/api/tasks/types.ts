export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "new" | "in_progress" | "completed";

export type CreateTaskRequest = {
    title: string;
    description: string;
    dueDate?: string;
    priority?: TaskPriority;
    assignedToUserId?: string;
};

export type UpdateTaskRequest = {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    assignedToUserId?: string;
};

export type UpdateTaskStatusRequest = {
    status: TaskStatus;
};

export type Task = {
    id: string;
    channelId: string;
    createdByUserId: string;
    assignedToUserId: string | null;
    title: string;
    description: string | null;
    dueDate: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: string;
    updatedAt: string;
};
