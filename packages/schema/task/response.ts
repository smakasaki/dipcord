import { z } from "zod";

import { ID, PaginationResult, StandardErrorResponses, UUID } from "../common/index.js";
import { TaskPriorityEnum, TaskStatusEnum } from "./types.js";

export const TaskResponse = ID.extend({
    channelId: UUID,
    createdByUserId: UUID,
    assignedToUserId: UUID.nullable(),
    title: z.string(),
    description: z.string().nullable(),
    dueDate: z.string().datetime().nullable(),
    priority: TaskPriorityEnum,
    status: TaskStatusEnum,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const PaginatedTasksResponse = PaginationResult(TaskResponse);

export const TaskErrorResponses = StandardErrorResponses;
