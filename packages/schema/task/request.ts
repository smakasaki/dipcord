import { z } from "zod";

import { UUID } from "../common/index.js";
import { FullQuery } from "../common/query.js";
import { TaskBase, TaskStatusEnum } from "./types.js";

export const TaskIdParam = z.object({
    taskId: UUID,
});

export const ChannelIdParam = z.object({
    channelId: UUID,
});

export const CreateTaskRequest = TaskBase;

export const UpdateTaskRequest = TaskBase.partial();

export const UpdateTaskStatusRequest = z.object({
    status: TaskStatusEnum,
});

export const TaskFilterQuery = FullQuery.extend({
    status: z.union([
        TaskStatusEnum,
        z.array(TaskStatusEnum),
    ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
    assignedToMe: z.coerce.boolean().optional(),
});
