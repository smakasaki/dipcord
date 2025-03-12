// Base application exception
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
