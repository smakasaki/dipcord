import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import { AuthenticationError } from "#commons/app/errors.js";
import { buildSessionConfig } from "#users/config/session-config.js";

/**
 * Authentication plugin for Fastify
 *
 * This plugin adds middleware to verify user authentication based on session cookies.
 * It also provides helpers for authenticated routes.
 */
const authPlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.sessionService) {
        throw new Error("Session service not found. Make sure it is registered before the auth plugin.");
    }

    if (!fastify.userService) {
        throw new Error("User service not found. Make sure it is registered before the auth plugin.");
    }

    /**
     * Authenticate middleware
     *
     * Verifies user session and adds user information to request
     */
    const authenticate = async (request: FastifyRequest) => {
        try {
            const { cookieName } = buildSessionConfig();
            const sessionToken = request.cookies[cookieName];

            if (!sessionToken) {
                throw new AuthenticationError("No session found");
            }

            const session = await fastify.sessionService.getSessionByToken(sessionToken);
            if (!session) {
                throw new AuthenticationError("Invalid or expired session");
            }

            const user = await fastify.userService.findById(session.userId);
            if (!user) {
                throw new AuthenticationError("User not found");
            }

            await fastify.sessionService.updateLastUsed(session.id);

            request.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                username: user.username,
                sessionId: session.id,
            };
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (error) {
            throw new AuthenticationError("Authentication failed");
        }
    };

    fastify.decorate("authenticate", authenticate);

    fastify.addHook("onRoute", (routeOptions) => {
        if (routeOptions.config?.auth === true) {
            const preHandler = routeOptions.preHandler;

            const handlers = preHandler
                ? Array.isArray(preHandler)
                    ? [...preHandler]
                    : [preHandler]
                : [];

            handlers.unshift(authenticate);

            routeOptions.preHandler = handlers;
        }
    });
};

export default fp(authPlugin, {
    name: "auth",
    dependencies: ["user-services"],
});
