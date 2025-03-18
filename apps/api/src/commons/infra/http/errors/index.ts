import type { FastifyInstance } from "fastify";

import { pascalCase } from "change-case";

import {
    ApplicationException,
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from "#commons/app/index.js";

// Global error handler for Fastify
export const errorHandler: FastifyInstance["errorHandler"] = function (
    error,
    request,
    reply,
) {
    if (error.validation || error.code === "FST_ERR_VALIDATION") {
        return reply.status(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: error.message,
        });
    }

    if (error instanceof NotFoundException) {
        return reply.notFound(error.message);
    }

    if (error instanceof UnauthorizedException) {
        return reply.unauthorized(error.message);
    }

    if (error instanceof BadRequestException) {
        return reply.badRequest(error.message);
    }

    if (error instanceof ConflictException) {
        return reply.conflict(error.message);
    }

    if (error instanceof ApplicationException) {
        return reply.internalServerError(error.message);
    }

    // Log unhandled errors with request context
    reply.log.error(
        {
            request: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body,
                query: request.query,
                params: request.params,
            },
            error,
        },
        "Unhandled error occurred",
    );

    // Return generic error message
    return reply.internalServerError("Internal Server Error");
};

// Helper to check if entity exists and throw NotFoundException if not
export function handleNotFound<TEntity extends Record<"id", string | number>>(
    entity: TEntity | undefined | null,
    id: TEntity["id"],
    name: string,
): asserts entity is TEntity {
    const entityName = pascalCase(name);
    if (!entity) {
        throw new NotFoundException(`${entityName} with id ${id} not found`);
    }
}
