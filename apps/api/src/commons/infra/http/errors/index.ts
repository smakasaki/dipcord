import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { pascalCase } from "change-case";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod";

import * as newErrors from "#commons/app/errors.js";
import * as oldErrors from "#commons/app/exceptions.js";

/**
 * Extract request context for logging
 */
function getRequestContext(request: FastifyRequest) {
    return {
        method: request.method,
        url: request.url,
        id: request.id,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
        route: request.url,
    };
}

export const errorHandler: FastifyInstance["errorHandler"] = function (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    // Handle Zod validation errors
    if (hasZodFastifySchemaValidationErrors(error)) {
        reply.log.warn({
            type: "schema_validation_error",
            code: "VALIDATION_ERROR",
            validation: error.validation,
            request: {
                method: request.method,
                url: request.url,
                id: request.id,
            },
        });

        return reply.status(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: "Validation error",
            code: "VALIDATION_ERROR",
            details: {
                issues: error.validation,
                method: request.method,
                url: request.url,
            },
        });
    }

    // Handle response serialization errors
    if (isResponseSerializationError(error)) {
        reply.log.error({
            err: error,
            request: getRequestContext(request),
            issues: error.cause?.issues,
            code: "SERIALIZATION_ERROR",
            type: "response_serialization_error",
        });

        return reply.code(500).send({
            error: "Internal Server Error",
            message: "Response doesn't match the schema",
            statusCode: 500,
            details: {
                issues: error.cause.issues,
                method: error.method,
                url: error.url,
            },
        });
    }

    // Handle standard Fastify validation errors (fallback)
    if (error.validation || error.code === "FST_ERR_VALIDATION") {
        reply.log.warn({
            type: "fastify_validation_error",
            code: error.code || "FST_ERR_VALIDATION",
            validation: error.validation,
            request: {
                method: request.method,
                url: request.url,
                id: request.id,
            },
        });

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
    let errorType = "unknown_error";

    // Check if it's using the new error system with statusCode property
    if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
        errorType = "application_error";
    }
    // Check if it's using the old error system
    else if (error instanceof oldErrors.NotFoundException) {
        statusCode = 404;
        errorType = "not_found_error";
    }
    else if (error instanceof oldErrors.UnauthorizedException) {
        statusCode = 401;
        errorType = "unauthorized_error";
    }
    else if (error instanceof oldErrors.BadRequestException) {
        statusCode = 400;
        errorType = "bad_request_error";
    }
    else if (error instanceof oldErrors.ConflictException) {
        statusCode = 409;
        errorType = "conflict_error";
    }
    else if (error instanceof oldErrors.ApplicationException) {
        statusCode = 500;
        errorType = "application_error";
    }

    // Get error code if available
    if ((error as any).code) {
        errorCode = (error as any).code;
    }

    // Log error with appropriate level based on status code
    const logMethod = statusCode >= 500 ? "error" : "warn";

    // For client errors (4xx), log minimal info unless it's a validation error
    if (statusCode < 500) {
        reply.log[logMethod]({
            type: errorType,
            code: errorCode,
            statusCode,
            message: error.message,
            request: {
                method: request.method,
                url: request.url,
                id: request.id,
            },
        });
    }
    else {
        // For server errors (5xx), log detailed information
        reply.log.error({
            err: error, // Contains stack trace already
            request: getRequestContext(request),
            statusCode,
            errorCode,
            type: errorType,
            payload: {
                body: request.body,
                query: request.query,
                params: request.params,
            },
        });
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
