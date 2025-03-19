import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

/**
 * Admin routes - main entry point
 * All admin routes are registered under the /admin prefix
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    fastify.register(import("./users.js"), { prefix: "/users" });
    fastify.register(import("./auth.js"), { prefix: "/auth" });
};

export default routes;
