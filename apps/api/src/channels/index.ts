// apps/api/src/channels/index.ts
import type { FastifyPluginAsync } from "fastify";

import autoLoad from "@fastify/autoload";
import fp from "fastify-plugin";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Channel module plugin
 *
 * This plugin registers all channel-related functionality:
 * - Channel services
 * - Routes for channels
 */
const channelModule: FastifyPluginAsync = async (fastify) => {
    // Register channel services first
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/services"),
        forceESM: true,
    });

    // Register channel routes
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
    });

    fastify.log.info("Channel module registered successfully");
};

export default fp(channelModule, {
    name: "channel-module",
    dependencies: ["database", "redis", "user-module"],
});
