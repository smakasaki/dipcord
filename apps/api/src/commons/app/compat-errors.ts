import * as newErrors from "./errors.js";
import * as oldErrors from "./exceptions.js";

/**
 * Maps an error from the old system to the new system
 * @param error Error from the old system
 * @returns Error from the new system
 */
export function mapOldErrorToNew(error: Error): Error {
    if (error instanceof oldErrors.NotFoundException) {
        return new newErrors.NotFoundError(error.message);
    }
    if (error instanceof oldErrors.UnauthorizedException) {
        return new newErrors.UnauthorizedError(error.message);
    }
    if (error instanceof oldErrors.BadRequestException) {
        return new newErrors.BadRequestError(error.message);
    }
    if (error instanceof oldErrors.ConflictException) {
        return new newErrors.ConflictError(error.message);
    }
    if (error instanceof oldErrors.ApplicationException) {
        return new newErrors.ApplicationError(error.message);
    }

    return error;
}

/**
 * Wraps a promise to catch old errors and rethrow as new errors
 * @param promise Promise that might throw old errors
 * @returns Promise that will throw new errors
 */
export async function withErrorMapping<T>(promise: Promise<T>): Promise<T> {
    try {
        return await promise;
    }
    catch (error) {
        if (error instanceof Error) {
            throw mapOldErrorToNew(error);
        }
        throw error;
    }
}

/**
 * Wraps a function to catch old errors and rethrow as new errors
 * @param fn Function that might throw old errors
 * @returns Function that will throw new errors
 */
export function wrapWithErrorMapping<T extends (...args: any[]) => any>(
    fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
        try {
            const result = fn(...args);

            // If result is a promise, handle async errors
            if (result instanceof Promise) {
                return withErrorMapping(result) as ReturnType<T>;
            }

            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                throw mapOldErrorToNew(error);
            }
            throw error;
        }
    };
}
