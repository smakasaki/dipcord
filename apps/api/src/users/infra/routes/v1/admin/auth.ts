import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
    AdminErrorResponses,
    DeleteAllUserSessionsResponseSchema,
    DeleteSessionResponseSchema,
    UserIdParam,
    UserResponse,
} from "@dipcord/schema";
import { SessionsListResponse } from "@dipcord/schema/auth";
import { Type } from "@sinclair/typebox";

import { mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * Admin authentication routes
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    /**
     * Get current admin profile
     */
    fastify.get("/profile", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Auth"],
            description: "Get current admin profile",
            response: {
                200: UserResponse,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.findById(request.user!.id);
        return mapUserToResponse(user);
    });

    /**
     * List all user sessions (admin only)
     */
    fastify.get("/sessions/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Auth"],
            description: "List all sessions for a user (admin only)",
            params: UserIdParam,
            response: {
                200: SessionsListResponse,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        // Find user to verify it exists
        await fastify.userService.findById(request.params.userId);

        // Get all sessions for the user
        const sessions = await fastify.sessionService.findSessionsByUserId(request.params.userId);

        // Map sessions to response format
        return {
            sessions: sessions.map(session => ({
                id: session.id,
                token: session.token,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                createdAt: session.createdAt.toISOString(),
                expiresAt: session.expiresAt.toISOString(),
                lastUsedAt: session.lastUsedAt.toISOString(),
            })),
        };
    });

    /**
     * Terminate a user session (admin only)
     */
    fastify.delete("/sessions/:sessionId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Auth"],
            description: "Terminate a user session (admin only)",
            params: Type.Object({
                sessionId: Type.String({ format: "uuid" }),
            }),
            response: {
                200: DeleteSessionResponseSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const session = await fastify.sessionService.deleteSession(request.params.sessionId);

        return {
            success: !!session,
            message: session ? "Session terminated successfully" : "Session not found",
        };
    });

    /**
     * Terminate all sessions for a user (admin only)
     */
    fastify.delete("/sessions/user/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Auth"],
            description: "Terminate all sessions for a user (admin only)",
            params: UserIdParam,
            response: {
                200: DeleteAllUserSessionsResponseSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        // Find user to verify it exists
        await fastify.userService.findById(request.params.userId);

        // Delete all sessions for the user
        const deletedCount = await fastify.sessionService.deleteUserSessions(request.params.userId);

        return {
            deletedCount,
            message: `Successfully terminated ${deletedCount} session(s)`,
        };
    });

    /**
     * Force password reset for a user (admin only)
     */
    fastify.post("/force-password-reset/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Auth"],
            description: "Force password reset for a user (admin only)",
            params: UserIdParam,
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    resetToken: Type.String(),
                    message: Type.String(),
                }),
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        // Find user to verify it exists
        await fastify.userService.findById(request.params.userId);

        // Generate password reset token
        const resetToken = await fastify.userService.createPasswordResetToken(request.params.userId);

        return {
            success: true,
            resetToken, // In a real production system, don't return this directly to the admin
            message: "Password reset token generated successfully",
        };
    });
};

export default routes;
