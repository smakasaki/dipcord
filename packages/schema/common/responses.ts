import { z } from "zod";

export const NoContent = z.object({});

export const ErrorResponse = z.object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string(),
    code: z.string().optional(),
});

export const ValidationError = z.object({
    field: z.string(),
    message: z.string(),
});

export const ValidationErrorResponse = ErrorResponse.extend({
    details: z.object({
        validationErrors: z.array(ValidationError).optional(),
        method: z.string().optional(),
        url: z.string().optional(),
    }).optional(),
});

export const StandardErrorResponses = {
    400: ValidationErrorResponse,
    401: ErrorResponse,
    403: ErrorResponse,
    404: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse,
};
