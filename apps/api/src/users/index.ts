// apps/api/src/users/index.ts
import type { FastifyPluginAsync } from "fastify";

import autoLoad from "@fastify/autoload";
import fp from "fastify-plugin";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import adminAuthPlugin from "./infra/plugins/admin-auth.js";
import authPlugin from "./infra/plugins/auth.js";
import oauthPlugin from "./infra/plugins/oauth.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * User module plugin
 *
 * This plugin registers all user-related functionality:
 * - User services
 * - Authentication plugins
 * - Routes for users, authentication, and admin
 */
const userModule: FastifyPluginAsync = async (fastify) => {
    // Register user services first (they are dependencies for auth plugins)
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/services"),
        forceESM: true,
    });

    // Register authentication plugins
    await fastify.register(authPlugin);
    await fastify.register(adminAuthPlugin);
    await fastify.register(oauthPlugin);

    // Register regular user routes (excluding admin routes)
    await fastify.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
        ignorePattern: /admin/,
    });

    // Register admin routes under /v1/admin prefix
    await fastify.register(import("./infra/routes/v1/admin/index.js"), {
        prefix: "/v1/admin",
    });

    fastify.log.info("User module registered successfully");
};

export default fp(userModule, {
    name: "user-module",
    dependencies: ["database", "redis"],
});
