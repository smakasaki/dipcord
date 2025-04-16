import type { Task } from "../entities/task.js";

export type CreateTaskData = {
    channelId: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    priority?: "low" | "medium" | "high";
    assignedToUserId?: string | null;
};

export type UpdateTaskData = Partial<{
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: "low" | "medium" | "high";
    assignedToUserId: string | null;
    status: "new" | "in_progress" | "completed";
}>;

export type TaskFilter = {
    channelId: string;
    status?: Array<"new" | "in_progress" | "completed">;
    assignedToUserId?: string;
};

export type TasksResult = {
    tasks: Task[];
    count: number;
};