import type { FastifyInstance, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import { UnauthorizedException } from "#commons/app/index.js";
import { AuthTokenService } from "#users/app/index.js";
import { buildJwtConfig } from "#users/config/jwt-config.js";

/**
 * Authentication plugin for Fastify
 * Adds authentication middleware and helpers
 */
export default fp(async (fastify: FastifyInstance) => {
    // Create auth token service
    const jwtConfig = buildJwtConfig();
    const authTokenService = new AuthTokenService(jwtConfig);

    // Add auth token service to fastify instance
    fastify.decorate("authTokenService", authTokenService);

    // Add authentication decorator
    fastify.decorate("authenticate", async (request: FastifyRequest) => {
        try {
            // Extract authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                throw new UnauthorizedException("Missing authorization header");
            }

            // Check if authorization header starts with Bearer
            if (!authHeader.startsWith("Bearer ")) {
                throw new UnauthorizedException("Invalid authorization format");
            }

            // Extract token
            const token = authHeader.substring(7);
            if (!token) {
                throw new UnauthorizedException("Missing token");
            }

            // Verify token
            const user = await authTokenService.verifyToken(token);

            // Add user to request
            request.user = user;
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (error) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    });

    // Register authentication hook for routes that require authentication
    fastify.addHook("onRoute", (routeOptions) => {
        if (routeOptions.config?.auth === true) {
            // Get the original preHandler hook
            const preHandler = routeOptions.preHandler;

            // Create an array of preHandlers if it doesn't exist
            const handlers = preHandler
                ? Array.isArray(preHandler)
                    ? [...preHandler]
                    : [preHandler]
                : [];

            // Add authentication preHandler
            handlers.unshift(fastify.authenticate);

            // Update the route's preHandler
            routeOptions.preHandler = handlers;
        }
    });
});
