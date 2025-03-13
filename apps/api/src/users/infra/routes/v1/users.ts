import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import
{ NoContent, PaginatedUsersSchema, Pagination, UserErrorResponses, UserIdParamSchema, UserSchema }
    from "@dipcord/schema";
import { Type } from "@sinclair/typebox";

import type { User } from "#users/app/models.js";

import { decodeSort, validateSortFields } from "#commons/infra/http/utils/decode-sort.js";
import { mapPaginatedUsersToResponse, mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * User management routes
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
     * Get all users with pagination
     */
    fastify.get("/", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Users"],
            description: "Get all users with pagination",
            querystring: Type.Intersect([
                Pagination,
                Type.Object({
                    sort: Type.Optional(Type.Array(
                        Type.Union([
                            Type.String(),
                            Type.String({ pattern: "^.+\\.(asc|desc)$" }),
                        ]),
                        { default: ["id.asc"] },
                    )),
                }),
            ]),
            response: {
                200: PaginatedUsersSchema,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        // Validate and filter sort fields to ensure they're valid keys of User
        const validatedSort = validateSortFields<User>(
            sort ?? ["id.asc"],
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
     * Get user by ID
     */
    fastify.get("/:userId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Users"],
            description: "Get user by ID",
            params: UserIdParamSchema,
            response: {
                200: UserSchema,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const user = await fastify.userService.findById(request.params.userId);
        return mapUserToResponse(user);
    });

    /**
     * Delete user
     */
    fastify.delete("/:userId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Users"],
            description: "Delete user",
            params: UserIdParamSchema,
            response: {
                204: NoContent,
                ...UserErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.userService.delete(request.params.userId);
        return reply.status(204).send();
    });
};

export default routes;
