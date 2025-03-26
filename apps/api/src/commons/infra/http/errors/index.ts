import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { pascalCase } from "change-case";

import * as newErrors from "#commons/app/errors.js";
import * as oldErrors from "#commons/app/exceptions.js";

export const errorHandler: FastifyInstance["errorHandler"] = function (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    if (error.validation || error.code === "FST_ERR_VALIDATION") {
        return reply.status(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: error.message,
            code: "FST_ERR_VALIDATION",
        });
    }

    // Handle exceptions from both old and new error systems
    // Check for specific error types and map to appropriate status codes
    let statusCode = 500;
    let errorCode = "FST_INTERNAL_SERVER_ERROR";

    // Check if it's using the new error system with statusCode property
    if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
    }
    // Check if it's using the old error system
    else if (error instanceof oldErrors.NotFoundException) {
        statusCode = 404;
    }
    else if (error instanceof oldErrors.UnauthorizedException) {
        statusCode = 401;
    }
    else if (error instanceof oldErrors.BadRequestException) {
        statusCode = 400;
    }
    else if (error instanceof oldErrors.ConflictException) {
        statusCode = 409;
    }
    else if (error instanceof oldErrors.ApplicationException) {
        statusCode = 500;
    }

    // Get error code if available
    if ((error as any).code) {
        errorCode = (error as any).code;
    }

    // For unhandled errors, log with request context
    if (statusCode === 500) {
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
    }

    // Return error response
    return reply.status(statusCode).send({
        statusCode,
        error: getErrorName(statusCode),
        message: error.message || "Internal Server Error",
        code: errorCode,
    });
};

export function handleNotFound<TEntity extends Record<"id", string | number>>(
    entity: TEntity | undefined | null,
    id: TEntity["id"],
    name: string,
): asserts entity is TEntity {
    const entityName = pascalCase(name);
    if (!entity) {
        const errorName = `${entityName}NotFoundError`;

        // Check in new errors first, then fall back to old ones
        const ErrorClass
            = (newErrors as any)[errorName]
                || newErrors.NotFoundError
                || oldErrors.NotFoundException;

        throw new ErrorClass(id);
    }
}

function getErrorName(statusCode: number): string {
    switch (statusCode) {
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 409: return "Conflict";
        case 422: return "Unprocessable Entity";
        case 429: return "Too Many Requests";
        default: return statusCode >= 500 ? "Internal Server Error" : "Unknown Error";
    }
}
