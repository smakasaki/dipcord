import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { LoginSchema, UserErrorResponses, UserSchema } from "@dipcord/schema";

import { mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * Authentication routes
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    /**
     * Login and create session
     */
    fastify.post("/login", {
        schema: {
            tags: ["Auth"],
            description: "Login and create session",
            body: LoginSchema,
            response: {
                200: UserSchema,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        // Login user and create session
        const { user, session } = await fastify.userService.login(
            request.body,
            request.ip,
            request.headers["user-agent"],
        );

        // Get cookie configuration from session service
        const { name, options } = fastify.sessionService.getCookieConfig();

        // Set session cookie with the token from the created session
        reply.setCookie(name, session.token, options);

        // Return mapped user response
        return mapUserToResponse(user);
    });

    /**
     * Logout and destroy session
     */
    fastify.post("/logout", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Auth"],
            description: "Logout and destroy session",
            response: {
                204: {},
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        if (request.user?.sessionId) {
            await fastify.userService.logout(request.user.sessionId);

            // Get cookie configuration
            const { name, options } = fastify.sessionService.getCookieConfig();

            // Clear session cookie
            reply.clearCookie(name, {
                path: options.path,
                domain: options.domain,
            });
        }

        return reply.status(204).send();
    });

    /**
     * Get current user session information
     */
    fastify.get("/me", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Auth"],
            description: "Get current user session information",
            response: {
                200: UserSchema,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.findById(request.user!.id);
        return mapUserToResponse(user);
    });
};

export default routes;
