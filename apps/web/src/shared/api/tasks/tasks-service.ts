import type { paths } from "../types/api";
import type { CreateTaskRequest, UpdateTaskRequest, UpdateTaskStatusRequest } from "./types";

import { DELETE, GET, PATCH, POST, PUT } from "../client";

// Get the types directly from the generated paths
type GetTasksParams = paths["/v1/channels/{channelId}/tasks"]["get"]["parameters"]["query"];

export const tasksService = {
    createTask: async (channelId: string, taskData: CreateTaskRequest) => {
        const result = await POST("/v1/channels/{channelId}/tasks", {
            params: {
                path: { channelId },
            },
            body: taskData,
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    getTasks: async (channelId: string, params: GetTasksParams = {}) => {
        const defaultParams: GetTasksParams = {
            limit: 10,
            offset: 0,
            sort: ["createdAt.desc"],
        };

        const queryParams = { ...defaultParams, ...params };

        const result = await GET("/v1/channels/{channelId}/tasks", {
            params: {
                path: { channelId },
                query: queryParams,
            },
        });

        if (result.error) {
            throw result.error;
        }

        return {
            count: result.data?.count || 0,
            data: result.data?.data || [],
        };
    },

    getTask: async (channelId: string, taskId: string) => {
        const result = await GET("/v1/channels/{channelId}/tasks/{taskId}", {
            params: {
                path: { channelId, taskId },
            },
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    updateTask: async (channelId: string, taskId: string, taskData: UpdateTaskRequest) => {
        const result = await PUT("/v1/channels/{channelId}/tasks/{taskId}", {
            params: {
                path: { channelId, taskId },
            },
            body: taskData,
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    updateTaskStatus: async (channelId: string, taskId: string, status: UpdateTaskStatusRequest) => {
        const result = await PATCH("/v1/channels/{channelId}/tasks/{taskId}/status", {
            params: {
                path: { channelId, taskId },
            },
            body: status,
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    deleteTask: async (channelId: string, taskId: string) => {
        const result = await DELETE("/v1/channels/{channelId}/tasks/{taskId}", {
            params: {
                path: { channelId, taskId },
            },
            body: JSON.stringify({}) as unknown as undefined,
        });

        if (result.error) {
            throw result.error;
        }

        return true;
    },
};
