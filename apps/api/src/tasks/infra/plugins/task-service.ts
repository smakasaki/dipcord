import type { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";

import type { TaskService } from "#tasks/app/tasks-service.js";

import { createTaskService } from "#tasks/app/tasks-service.js";
import { TaskDao } from "#tasks/infra/dao/task-dao.js";
import { WebSocketTaskNotificationService } from "#tasks/infra/services/notification-service.js";

import { ChannelMemberDao } from "../dao/channel-member-dao.js";

/**
 * Task service plugin for Fastify
 *
 * This plugin registers the task service and its dependencies
 */
const taskServicePlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.db) {
        throw new Error("Database not found. Make sure it is registered before the task service plugin.");
    }

    // Create repositories
    const taskRepository = new TaskDao(fastify.db);
    const channelMemberRepository = new ChannelMemberDao(fastify.db);

    // Create notification service
    const notificationService = new WebSocketTaskNotificationService(fastify);

    // Create task service
    const taskService = createTaskService({
        taskRepository,
        channelMemberRepository,
        notificationService,
    });

    // Register the task service
    fastify.decorate("taskService", taskService);

    fastify.log.info("Task service registered");
};

declare module "fastify" {
    // eslint-disable-next-line ts/consistent-type-definitions
    interface FastifyInstance {
        taskService: TaskService;
    }
}

export default fp(taskServicePlugin, {
    name: "task-service",
    dependencies: ["database", "websocket", "channel-services"],
});
