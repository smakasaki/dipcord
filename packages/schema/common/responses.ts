import { z } from "zod";

export const NoContent = z.object({});

export const ErrorResponse = z.object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string(),
});

export const StandardErrorResponses = {
    400: ErrorResponse,
    401: ErrorResponse,
    403: ErrorResponse,
    404: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse,
};
