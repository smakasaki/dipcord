import type { CreateTaskData, Task, TaskFilter, TasksResult, UpdateTaskData } from "@dipcord/domain";

import type { Pagination, SortBy } from "#commons/app/index.js";

export type CreateTaskParams = {
    userId: string;
    data: CreateTaskData;
};

export type CreateTaskUseCase = {
    execute: (params: CreateTaskParams) => Promise<Task>;
};

export type GetTaskParams = {
    userId: string;
    taskId: string;
};

export type GetTaskUseCase = {
    execute: (params: GetTaskParams) => Promise<Task>;
};

export type GetTasksParams = {
    userId: string;
    filter: TaskFilter;
    pagination: Pagination;
    sortBy: SortBy<Task>;
};

export type GetTasksUseCase = {
    execute: (params: GetTasksParams) => Promise<TasksResult>;
};

export type UpdateTaskParams = {
    userId: string;
    taskId: string;
    data: UpdateTaskData;
};

export type UpdateTaskUseCase = {
    execute: (params: UpdateTaskParams) => Promise<Task>;
};

export type UpdateTaskStatusParams = {
    userId: string;
    taskId: string;
    status: "new" | "in_progress" | "completed";
};

export type UpdateTaskStatusUseCase = {
    execute: (params: UpdateTaskStatusParams) => Promise<Task>;
};

export type DeleteTaskParams = {
    userId: string;
    taskId: string;
};

export type DeleteTaskUseCase = {
    execute: (params: DeleteTaskParams) => Promise<Task>;
};
