import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

/**
 * Admin routes - main entry point
 * All admin routes are registered under the /admin prefix
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    fastify.register(import("./users.js"), { prefix: "/users" });
    fastify.register(import("./auth.js"), { prefix: "/auth" });
};

export default routes;
