import type { FastifyInstance, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import { UnauthorizedException } from "#commons/app/index.js";

/**
 * Admin role check middleware
 * This plugin adds middleware to verify that a user has admin privileges
 */
export default fp(async (fastify: FastifyInstance) => {
    // First, make sure the auth plugin is registered
    if (!fastify.authenticate) {
        throw new Error("Authentication plugin must be registered before admin auth plugin");
    }

    // Add method to check if user is an admin
    fastify.decorate("authenticateAdmin", async (request: FastifyRequest) => {
        await fastify.authenticate(request);
        const isAdmin = await fastify.userService.isUserAdmin(request.user!.id);

        if (!isAdmin) {
            throw new UnauthorizedException("Admin privileges required");
        }
    });

    // Register onRoute hook to add admin authentication for routes with config.adminAuth = true
    fastify.addHook("onRoute", (routeOptions) => {
        if (routeOptions.config?.adminAuth === true) {
            // Get the original preHandler hook
            const preHandler = routeOptions.preHandler;

            // Create an array of preHandlers if it doesn't exist
            const handlers = preHandler
                ? Array.isArray(preHandler)
                    ? [...preHandler]
                    : [preHandler]
                : [];

            // Add admin authentication preHandler
            handlers.unshift(fastify.authenticateAdmin);

            // Update the route's preHandler
            routeOptions.preHandler = handlers;
        }
    });
});
