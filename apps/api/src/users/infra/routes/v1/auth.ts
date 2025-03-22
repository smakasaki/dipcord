import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
    CreateUserRequest,
    NoContent,
    UserErrorResponses,
    UserResponse,
} from "@dipcord/schema";
import { ChangePasswordRequest, LoginRequest, RequestPasswordResetRequest, ResetPasswordRequest } from "@dipcord/schema/auth";

import { mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * Authentication routes
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    /**
     * Register a new user
     */
    fastify.post("/auth/register", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth"],
            description: "Register a new user",
            body: CreateUserRequest,
            response: {
                201: UserResponse,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        const user = await fastify.userService.create(request.body);

        // Automatically log in the user after successful registration
        const { session } = await fastify.userService.createSession(
            user,
            request.ip,
            request.headers["user-agent"],
        );

        // Get cookie configuration from session service
        const { name, options } = fastify.sessionService.getCookieConfig();

        // Set session cookie with the token from the created session
        reply.setCookie(name, session.token, options);

        return reply.status(201).send(mapUserToResponse(user));
    });

    /**
     * Login and create session
     */
    fastify.post("/auth/login", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth"],
            description: "Login and create session",
            body: LoginRequest,
            response: {
                200: UserResponse,
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
    fastify.post("/auth/logout", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Auth"],
            description: "Logout and destroy session",
            response: {
                204: NoContent,
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
    fastify.get("/auth/profile", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Auth"],
            description: "Get current user session information",
            response: {
                200: UserResponse,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.findById(request.user!.id);
        return mapUserToResponse(user);
    });

    /**
     * Request a password reset
     */
    fastify.post("/auth/password/reset-request", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth"],
            description: "Request a password reset",
            body: RequestPasswordResetRequest,
            response: {
                204: NoContent,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        const { email } = request.body;

        // Find the user by email
        const user = await fastify.userService.findByEmail(email);

        // Even if user doesn't exist, return 204 to prevent email enumeration
        if (!user) {
            return reply.status(204).send();
        }

        // Generate reset token
        await fastify.userService.createPasswordResetToken(user.id);

        // Note: In a real application, you would send an email with the reset token
        // For this MVP, we're just implementing the API endpoints

        return reply.status(204).send();
    });

    /**
     * Reset password using token
     */
    fastify.post("/auth/password/reset", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth"],
            description: "Reset password using token",
            body: ResetPasswordRequest,
            response: {
                204: NoContent,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        const { token, password } = request.body;

        // Verify token and reset password
        await fastify.userService.resetPassword(token, password);

        return reply.status(204).send();
    });

    /**
     * Change password (for authenticated users)
     */
    fastify.post("/auth/password/change", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Auth"],
            description: "Change password for authenticated user",
            body: ChangePasswordRequest,
            response: {
                204: NoContent,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        // This is an authenticated endpoint, so request.user is available
        await fastify.userService.changePassword(
            request.user!.id,
            request.body.currentPassword,
            request.body.newPassword,
        );

        return reply.status(204).send();
    });
};

export default routes;
