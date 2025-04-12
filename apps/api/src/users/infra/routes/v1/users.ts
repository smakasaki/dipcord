import type { FastifyReply } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
    NoContent,
    PublicUserProfileResponse,
    UpdateUserProfileRequest,
    UserErrorResponses,
    UserIdParam,
    UserResponse,
} from "@dipcord/schema";

import { mapUserToResponse } from "#users/infra/utils/user-mapper.js";

// Define schemas for routes for better type inference
const getMeSchema = {
    tags: ["Users"],
    description: "Get current user profile",
    response: {
        200: UserResponse,
        ...UserErrorResponses,
    },
    security: [{ cookieAuth: [] }],
};

const updateMeSchema = {
    tags: ["Users"],
    description: "Update current user profile",
    body: UpdateUserProfileRequest,
    response: {
        200: UserResponse,
        ...UserErrorResponses,
    },
    security: [{ cookieAuth: [] }],
};

const deleteMeSchema = {
    tags: ["Users"],
    description: "Delete current user account",
    response: {
        204: NoContent,
        ...UserErrorResponses,
    },
    security: [{ cookieAuth: [] }],
};

const getUserSchema = {
    tags: ["Users"],
    description: "Get user public profile by ID",
    params: UserIdParam,
    response: {
        200: PublicUserProfileResponse,
        ...UserErrorResponses,
    },
    security: [{ cookieAuth: [] }],
};

/**
 * User management routes for regular users
 * Admin functionality is moved to admin routes
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    /**
     * Get current user
     */
    fastify.get("/users/me", {
        config: {
            auth: true,
        },
        schema: getMeSchema,
    }, async (request) => {
        const user = await fastify.userService.findById(request.user!.id);
        return mapUserToResponse(user);
    });

    /**
     * Update current user
     */
    fastify.put("/users/me", {
        config: {
            auth: true,
        },
        schema: updateMeSchema,
    }, async (request) => {
        const user = await fastify.userService.update(request.user!.id, request.body);
        return mapUserToResponse(user);
    });

    /**
     * Delete current user
     */
    fastify.delete("/users/me", {
        config: {
            auth: true,
        },
        schema: deleteMeSchema,
    }, async (request, reply: FastifyReply) => {
        // Delete the user's account
        await fastify.userService.delete(request.user!.id);

        // Clear session cookie
        const { name, options } = fastify.sessionService.getCookieConfig();
        reply.clearCookie(name, {
            path: options.path,
            domain: options.domain,
        });

        return reply.status(204).send();
    });

    /**
     * Get user by ID (public profile)
     * This endpoint returns limited public information
     */
    fastify.get("/users/:userId", {
        config: {
            auth: true, // Requires authentication but not admin privileges
        },
        schema: getUserSchema,
    }, async (request) => {
        const user = await fastify.userService.findById(request.params.userId);

        // Return limited public information
        return {
            id: user.id,
            name: user.name,
            surname: user.surname,
            username: user.username,
            // Email is excluded from public profile
        };
    });
};

export default routes;
