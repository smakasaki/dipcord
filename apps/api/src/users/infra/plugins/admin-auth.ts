// apps/api/src/users/infra/plugins/admin-auth.ts
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import { ForbiddenError } from "#commons/app/errors.js";

/**
 * Admin role check plugin
 *
 * This plugin adds middleware to verify that a user has admin privileges
 * and provides helpers for admin-only routes.
 */
const adminAuthPlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.authenticate) {
        throw new Error("Authentication plugin must be registered before admin auth plugin");
    }

    /**
     * Authenticate admin middleware
     *
     * First authenticates the user, then verifies admin role
     */
    const authenticateAdmin = async (request: FastifyRequest) => {
        await fastify.authenticate(request);

        const isAdmin = await fastify.userService.isUserAdmin(request.user!.id);

        if (!isAdmin) {
            throw new ForbiddenError("Admin privileges required");
        }
    };

    fastify.decorate("authenticateAdmin", authenticateAdmin);

    // Register onRoute hook to add admin authentication for routes with config.adminAuth = true
    fastify.addHook("onRoute", (routeOptions) => {
        if (routeOptions.config?.adminAuth === true) {
            const preHandler = routeOptions.preHandler;

            const handlers = preHandler
                ? Array.isArray(preHandler)
                    ? [...preHandler]
                    : [preHandler]
                : [];

            handlers.unshift(authenticateAdmin);

            routeOptions.preHandler = handlers;
        }
    });
};

export default fp(adminAuthPlugin, {
    name: "admin-auth",
    dependencies: ["auth"],
});
