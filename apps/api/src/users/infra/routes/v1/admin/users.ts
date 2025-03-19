import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
    AdminErrorResponses,
    AdminUpdateUserSchema,
    CreateUserSchema,
    NoContent,
    PaginatedUsersSchema,
    Pagination,
    UserIdParamSchema,
    UserRoleUpdatedSchema,
    UserSchema,
} from "@dipcord/schema";
import { Type } from "@fastify/type-provider-typebox";

import type { User } from "#users/app/models.js";

import { decodeSort, validateSortFields } from "#commons/infra/http/utils/decode-sort.js";
import { mapPaginatedUsersToResponse, mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * Admin routes for user management
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    // Define valid sort fields for User entity
    const validUserSortFields: Array<keyof User & string> = [
        "id",
        "name",
        "surname",
        "email",
        "createdAt",
        "updatedAt",
    ];

    /**
     * Get all users with pagination (admin route)
     */
    fastify.get("/", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Get all users with pagination",
            querystring: Type.Intersect([
                Pagination,
                Type.Object({
                    sort: Type.Optional(Type.Array(
                        Type.Union([
                            Type.String(),
                            Type.String({ pattern: "^.+\\.(asc|desc)$" }),
                        ]),
                        { default: ["createdAt.desc"] },
                    )),
                }),
            ]),
            response: {
                200: PaginatedUsersSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        // Validate and filter sort fields to ensure they're valid keys of User
        const validatedSort = validateSortFields<User>(
            sort ?? ["createdAt.desc"],
            validUserSortFields,
        );

        // Get the data from the service with type-safe sort
        const result = await fastify.userService.findAll(
            { offset: offset ?? 0, limit: limit ?? 10 },
            decodeSort<User>(validatedSort),
        );

        // Transform domain model to API response format
        return mapPaginatedUsersToResponse(result);
    });

    /**
     * Get user by ID (admin route)
     */
    fastify.get("/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Get user by ID",
            params: UserIdParamSchema,
            response: {
                200: UserSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.findById(request.params.userId);
        return mapUserToResponse(user);
    });

    /**
     * Create a new user (admin route)
     */
    fastify.post("/", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Create a new user",
            body: CreateUserSchema,
            response: {
                201: UserSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const user = await fastify.userService.create(request.body);
        return reply.status(201).send(mapUserToResponse(user));
    });

    /**
     * Update user (admin route)
     */
    fastify.put("/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Update user",
            params: UserIdParamSchema,
            body: AdminUpdateUserSchema,
            response: {
                200: UserSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        // This would require adding an update method to UserService and UserRepository
        const user = await fastify.userService.update(
            request.params.userId,
            request.body,
        );
        return mapUserToResponse(user);
    });

    /**
     * Delete user (admin route)
     */
    fastify.delete("/:userId", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Delete user",
            params: UserIdParamSchema,
            response: {
                204: NoContent,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.userService.delete(request.params.userId);
        return reply.status(204).send();
    });

    /**
     * Add admin role to user
     */
    fastify.post("/:userId/roles/admin", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Add admin role to user",
            params: UserIdParamSchema,
            response: {
                200: UserRoleUpdatedSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.addAdminRole(request.params.userId);
        return {
            userId: user.id,
            roles: user.roles,
            message: "Admin role added successfully",
        };
    });

    /**
     * Remove admin role from user
     */
    fastify.delete("/:userId/roles/admin", {
        config: {
            adminAuth: true,
        },
        schema: {
            tags: ["Admin", "Users"],
            description: "Remove admin role from user",
            params: UserIdParamSchema,
            response: {
                200: UserRoleUpdatedSchema,
                ...AdminErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.removeAdminRole(request.params.userId);
        return {
            userId: user.id,
            roles: user.roles,
            message: "Admin role removed successfully",
        };
    });
};

export default routes;
