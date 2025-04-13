import type { FastifyPluginAsync } from "fastify";

import autoLoad from "@fastify/autoload";
import fp from "fastify-plugin";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Chat module plugin
 *
 * This plugin registers all chat-related functionality:
 * - Chat services
 * - Routes for messages, reactions, attachments, etc.
 */
const chatModule: FastifyPluginAsync = async (fastify) => {
    // Register chat services first
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/plugins"),
        forceESM: true,
    });

    // Register chat routes
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
    });

    fastify.log.info("Chat module registered successfully");
};

export default fp(chatModule, {
    name: "chat-module",
    dependencies: ["database", "redis", "user-module", "channel-module", "websocket"],
});
