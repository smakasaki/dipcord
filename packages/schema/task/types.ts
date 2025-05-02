import { z } from "zod";

import { UUID } from "../common/index.js";

export const TaskStatusEnum = z.enum([
    "new",
    "in_progress",
    "completed",
]);

export const TaskPriorityEnum = z.enum([
    "low",
    "medium",
    "high",
]);

export const TaskBase = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    priority: TaskPriorityEnum.default("medium").optional(),
    assignedToUserId: UUID.nullable().optional(),
});
