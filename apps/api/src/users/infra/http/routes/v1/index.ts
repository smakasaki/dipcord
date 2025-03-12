import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { NoContent, PaginatedUsersSchema, Pagination, UserErrorResponses, UserIdParamSchema, UserSchema,
} from "@dipcord/schema";
import { Type } from "@sinclair/typebox";

import { decodeSort } from "#commons/infra/http/utils/decode-sort.js";

/**
 * User management routes
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    /**
     * Get all users with pagination
     */
    fastify.get("/", {
        // config: {
        //     auth: true,
        // },
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
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;
        return fastify.userService.findAll(
            { offset: offset ?? 0, limit: limit ?? 10 },
            decodeSort(sort ?? ["id.asc"]),
        );
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
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        return fastify.userService.findById(request.params.userId);
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
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.userService.delete(request.params.userId);
        return reply.status(204).send();
    });
};

export default routes;
