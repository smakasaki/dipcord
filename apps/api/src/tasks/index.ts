// src/tasks/index.ts
import type { FastifyPluginAsync } from "fastify";

import autoLoad from "@fastify/autoload";
import fp from "fastify-plugin";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Task module plugin
 *
 * This plugin registers all task-related functionality:
 * - Task services
 * - Routes for tasks
 */
const taskModule: FastifyPluginAsync = async (fastify) => {
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/plugins"),
        forceESM: true,
    });

    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
    });

    fastify.log.info("Task module registered successfully");
};

export default fp(taskModule, {
    name: "task-module",
    dependencies: ["database", "redis", "user-module", "channel-module", "websocket"],
});
