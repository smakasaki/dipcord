import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { z } from "zod";

import {
    ChannelIdParam,
    NoContent,
    StandardErrorResponses as TaskErrorResponses,
} from "@dipcord/schema";
import {
    CreateTaskRequest,
    PaginatedTasksResponse,
    TaskFilterQuery,
    TaskIdParam,
    TaskResponse,
    UpdateTaskRequest,
    UpdateTaskStatusRequest,
} from "@dipcord/schema/task";

import { decodeSort, validateSortFields } from "#commons/infra/http/utils/decode-sort.js";

/**
 * Task routes
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    /**
     * Create a new task
     */
    fastify.post("/channels/:channelId/tasks", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Create a new task in a channel",
            params: ChannelIdParam,
            body: CreateTaskRequest,
            response: {
                201: TaskResponse,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { channelId } = request.params;
        const userId = request.user!.id;

        const task = await fastify.taskService.createTask({
            userId,
            data: {
                ...request.body,
                channelId,
                dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
            },
        });

        return reply.status(201).send({
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        });
    });

    /**
     * Get tasks for a channel with filtering
     */
    fastify.get("/channels/:channelId/tasks", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Get tasks for a channel with filtering",
            params: ChannelIdParam,
            querystring: TaskFilterQuery,
            response: {
                200: PaginatedTasksResponse,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { channelId } = request.params;
        const { offset, limit, sort, status, assignedToMe } = request.query;
        const userId = request.user!.id;

        // Define valid sort fields
        const validSortFields = ["id", "title", "createdAt", "updatedAt", "dueDate", "priority", "status"];
        const validatedSort = validateSortFields(sort || ["createdAt.desc"], validSortFields);

        const filter = {
            channelId,
            status,
            // If assignedToMe is true, only show tasks assigned to current user
            assignedToUserId: assignedToMe ? userId : undefined,
        };

        const result = await fastify.taskService.getTasks({
            userId,
            filter,
            pagination: { offset: offset ?? 0, limit: limit ?? 20 },
            sortBy: decodeSort(validatedSort) as any, // Type assertion to bypass the type error
        });

        return {
            count: result.count,
            data: result.tasks.map(task => ({
                ...task,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            })),
        };
    });

    /**
     * Get a specific task
     */
    fastify.get("/channels/:channelId/tasks/:taskId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Get a specific task",
            params: ChannelIdParam.merge(TaskIdParam),
            response: {
                200: TaskResponse,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { taskId } = request.params;
        const userId = request.user!.id;

        const task = await fastify.taskService.getTask({
            userId,
            taskId,
        });

        return {
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        };
    });

    /**
     * Update a task
     */
    fastify.put("/channels/:channelId/tasks/:taskId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Update a task",
            params: ChannelIdParam.merge(TaskIdParam),
            body: UpdateTaskRequest,
            response: {
                200: TaskResponse,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { taskId } = request.params;
        const userId = request.user!.id;

        const task = await fastify.taskService.updateTask({
            userId,
            taskId,
            data: {
                ...request.body,
                dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
            },
        });

        return {
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        };
    });

    /**
     * Update task status
     */
    fastify.patch("/channels/:channelId/tasks/:taskId/status", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Update task status",
            params: ChannelIdParam.merge(TaskIdParam),
            body: UpdateTaskStatusRequest,
            response: {
                200: TaskResponse,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { taskId } = request.params as z.infer<typeof TaskIdParam & typeof ChannelIdParam>;
        const { status } = request.body as z.infer<typeof UpdateTaskStatusRequest>;
        const userId = request.user!.id;

        const task = await fastify.taskService.updateTaskStatus({
            userId,
            taskId,
            status,
        });

        return {
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        };
    });

    /**
     * Delete a task
     */
    fastify.delete("/channels/:channelId/tasks/:taskId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Tasks"],
            description: "Delete a task",
            params: ChannelIdParam.merge(TaskIdParam),
            response: {
                204: NoContent,
                ...TaskErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { taskId } = request.params;
        const userId = request.user!.id;

        await fastify.taskService.deleteTask({
            userId,
            taskId,
        });

        return reply.status(204).send();
    });
};

export default routes;
