import type { CreateTaskData, Task, TaskFilter, UpdateTaskData } from "@dipcord/domain";

import type { Pagination, SortBy } from "#commons/app/index.js";

export type TaskRepository = {
    createTask: (data: CreateTaskData & { createdByUserId: string }) => Promise<Task>;
    findTaskById: (taskId: string) => Promise<Task | null>;
    findTasks: (filter: TaskFilter, pagination: Pagination, sortBy: SortBy<Task>) => Promise<{
        tasks: Task[];
        count: number;
    }>;
    updateTask: (taskId: string, data: UpdateTaskData) => Promise<Task>;
    deleteTask: (taskId: string) => Promise<Task>;
};

export type ChannelMemberRepository = {
    isUserChannelMember: (userId: string, channelId: string) => Promise<boolean>;
    getUserPermissionsInChannel: (userId: string, channelId: string) => Promise<{
        role: "owner" | "moderator" | "user";
        permissions: {
            manage_tasks: boolean;
            [key: string]: boolean;
        } | null;
    } | null>;
};

export type NotificationService = {
    notifyTaskCreated: (task: Task) => Promise<void>;
    notifyTaskUpdated: (task: Task) => Promise<void>;
    notifyTaskDeleted: (task: Task) => Promise<void>;
};
