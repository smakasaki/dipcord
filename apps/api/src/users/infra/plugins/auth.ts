import type { FastifyInstance, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import type { SessionService } from "#users/app/session-service.js";
import type { UserService } from "#users/app/user-service.js";

import { UnauthorizedException } from "#commons/app/index.js";
import { buildSessionConfig } from "#users/config/session-config.js";

/**
 * Authentication plugin for Fastify
 * Adds authentication middleware and helpers for session-based auth
 */
export default fp(async (fastify: FastifyInstance) => {
    const sessionService = fastify.sessionService as SessionService;
    const userService = fastify.userService as UserService;

    if (!sessionService) {
        throw new Error("Session service not found. Make sure it is registered before the auth plugin.");
    }

    if (!userService) {
        throw new Error("User service not found. Make sure it is registered before the auth plugin.");
    }

    fastify.decorate("authenticate", async (request: FastifyRequest) => {
        try {
            // Get the session cookie
            const { cookieName } = buildSessionConfig();
            const sessionToken = request.cookies[cookieName];

            if (!sessionToken) {
                throw new UnauthorizedException("No session found");
            }

            // Verify session token
            const session = await sessionService.getSessionByToken(sessionToken);
            if (!session) {
                throw new UnauthorizedException("Invalid or expired session");
            }

            // Get user information
            const user = await userService.findById(session.userId);
            if (!user) {
                throw new UnauthorizedException("User not found");
            }

            // Update last used timestamp
            await sessionService.updateLastUsed(session.id);

            // Add user and session to request
            request.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                sessionId: session.id,
            };
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (error) {
            throw new UnauthorizedException("Authentication failed");
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
