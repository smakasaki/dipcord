/**
 * Unit tests for application exceptions
 */
import { describe, expect, it } from "vitest";

import {
    ApplicationException,
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from "#commons/app/exceptions.js";

describe("application Exceptions", () => {
    describe("applicationException", () => {
        it("should create an instance with the correct message and name", () => {
            const message = "Application error occurred";
            const error = new ApplicationException(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApplicationException);
            expect(error.message).toBe(message);
            expect(error.name).toBe("ApplicationException");
        });
    });

    describe("notFoundException", () => {
        it("should create an instance with the correct message and inheritance", () => {
            const message = "Resource not found";
            const error = new NotFoundException(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApplicationException);
            expect(error).toBeInstanceOf(NotFoundException);
            expect(error.message).toBe(message);
            expect(error.name).toBe("NotFoundException");
        });
    });

    describe("unauthorizedException", () => {
        it("should create an instance with the correct message and inheritance", () => {
            const message = "Unauthorized access";
            const error = new UnauthorizedException(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApplicationException);
            expect(error).toBeInstanceOf(UnauthorizedException);
            expect(error.message).toBe(message);
            expect(error.name).toBe("UnauthorizedException");
        });
    });

    describe("badRequestException", () => {
        it("should create an instance with the correct message and inheritance", () => {
            const message = "Invalid request data";
            const error = new BadRequestException(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApplicationException);
            expect(error).toBeInstanceOf(BadRequestException);
            expect(error.message).toBe(message);
            expect(error.name).toBe("BadRequestException");
        });
    });

    describe("conflictException", () => {
        it("should create an instance with the correct message and inheritance", () => {
            const message = "Resource already exists";
            const error = new ConflictException(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApplicationException);
            expect(error).toBeInstanceOf(ConflictException);
            expect(error.message).toBe(message);
            expect(error.name).toBe("ConflictException");
        });
    });
});
