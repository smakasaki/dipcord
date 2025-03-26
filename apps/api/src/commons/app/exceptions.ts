/**
 * @deprecated Use the new error classes from commons/errors/index.ts instead
 * This file is kept for backward compatibility
 */

export class ApplicationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundException extends ApplicationException {
    constructor(message: string) {
        super(message);
    }
}

export class UnauthorizedException extends ApplicationException {
    constructor(message: string) {
        super(message);
    }
}

export class BadRequestException extends ApplicationException {
    constructor(message: string) {
        super(message);
    }
}

export class ConflictException extends ApplicationException {
    constructor(message: string) {
        super(message);
    }
}

export class InternalServerErrorException extends ApplicationException {
    constructor(message: string) {
        super(message);
    }
}

console.warn(`[DEPRECATED] The exception classes in commons/app/exceptions.ts are deprecated.
    Please use the new error classes from commons/errors/index.ts instead.
    This file will be removed in a future version.`);
