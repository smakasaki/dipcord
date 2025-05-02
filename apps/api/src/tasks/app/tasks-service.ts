import type { ChannelMemberRepository, NotificationService, TaskRepository } from "./ports/outgoing.js";

import { createCreateTaskUseCase } from "./use-cases/create-task.js";
import { createDeleteTaskUseCase } from "./use-cases/delete-task.js";
import { createGetTaskUseCase } from "./use-cases/get-task.js";
import { createGetTasksUseCase } from "./use-cases/get-tasks.js";
import { createUpdateTaskStatusUseCase } from "./use-cases/update-task-status.js";
import { createUpdateTaskUseCase } from "./use-cases/update-task.js";

export type TaskServiceDependencies = {
    taskRepository: TaskRepository;
    channelMemberRepository: ChannelMemberRepository;
    notificationService: NotificationService;
};

export function createTaskService(deps: TaskServiceDependencies) {
    const createTaskUseCase = createCreateTaskUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    const getTaskUseCase = createGetTaskUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
    );

    const getTasksUseCase = createGetTasksUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
    );

    const updateTaskUseCase = createUpdateTaskUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    const updateTaskStatusUseCase = createUpdateTaskStatusUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    const deleteTaskUseCase = createDeleteTaskUseCase(
        deps.taskRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    return {
        createTask: createTaskUseCase.execute,
        getTask: getTaskUseCase.execute,
        getTasks: getTasksUseCase.execute,
        updateTask: updateTaskUseCase.execute,
        updateTaskStatus: updateTaskStatusUseCase.execute,
        deleteTask: deleteTaskUseCase.execute,
    };
}

export type TaskService = ReturnType<typeof createTaskService>;
