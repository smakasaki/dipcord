import type { FastifyError } from "fastify";

/**
 * Unit tests for error handlers
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    ApplicationException,
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from "#commons/app/index.js";
import { errorHandler, handleNotFound } from "#commons/infra/http/errors/index.js";

// Создаем более точные типы для моков
type MockRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
    query: Record<string, unknown>;
    params: Record<string, unknown>;
};

type MockReply = {
    notFound: (message: string) => MockReply;
    unauthorized: (message: string) => MockReply;
    badRequest: (message: string) => MockReply;
    conflict: (message: string) => MockReply;
    internalServerError: (message: string) => MockReply;
    log: {
        error: (obj: unknown, message: string) => void;
    };
};

// Функция для приведения наших исключений к типу FastifyError
// Это чисто типовой костыль для тестов, не меняющий реальное поведение
function asError<T extends Error>(error: T): T & FastifyError {
    return error as T & FastifyError;
}

describe("errorHandlers", () => {
    // Mock request and reply objects for testing
    let mockRequest: MockRequest;
    let mockReply: MockReply;

    beforeEach(() => {
        // Reset mocks before each test
        mockRequest = {
            method: "GET",
            url: "/test",
            headers: { "content-type": "application/json" },
            body: {},
            query: {},
            params: {},
        };

        mockReply = {
            notFound: vi.fn().mockReturnThis(),
            unauthorized: vi.fn().mockReturnThis(),
            badRequest: vi.fn().mockReturnThis(),
            conflict: vi.fn().mockReturnThis(),
            internalServerError: vi.fn().mockReturnThis(),
            log: {
                error: vi.fn(),
            },
        };
    });

    describe("errorHandler", () => {
        it("should handle NotFoundException", () => {
            // Arrange
            const error = new NotFoundException("Resource not found");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.notFound).toHaveBeenCalledWith("Resource not found");
            expect(mockReply.unauthorized).not.toHaveBeenCalled();
            expect(mockReply.badRequest).not.toHaveBeenCalled();
            expect(mockReply.conflict).not.toHaveBeenCalled();
            expect(mockReply.internalServerError).not.toHaveBeenCalled();
        });

        it("should handle UnauthorizedException", () => {
            // Arrange
            const error = new UnauthorizedException("Unauthorized access");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.unauthorized).toHaveBeenCalledWith("Unauthorized access");
            expect(mockReply.notFound).not.toHaveBeenCalled();
            expect(mockReply.badRequest).not.toHaveBeenCalled();
            expect(mockReply.conflict).not.toHaveBeenCalled();
            expect(mockReply.internalServerError).not.toHaveBeenCalled();
        });

        it("should handle BadRequestException", () => {
            // Arrange
            const error = new BadRequestException("Invalid request data");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.badRequest).toHaveBeenCalledWith("Invalid request data");
            expect(mockReply.notFound).not.toHaveBeenCalled();
            expect(mockReply.unauthorized).not.toHaveBeenCalled();
            expect(mockReply.conflict).not.toHaveBeenCalled();
            expect(mockReply.internalServerError).not.toHaveBeenCalled();
        });

        it("should handle ConflictException", () => {
            // Arrange
            const error = new ConflictException("Resource already exists");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.conflict).toHaveBeenCalledWith("Resource already exists");
            expect(mockReply.notFound).not.toHaveBeenCalled();
            expect(mockReply.unauthorized).not.toHaveBeenCalled();
            expect(mockReply.badRequest).not.toHaveBeenCalled();
            expect(mockReply.internalServerError).not.toHaveBeenCalled();
        });

        it("should handle generic ApplicationException", () => {
            // Arrange
            const error = new ApplicationException("Application error occurred");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.internalServerError).toHaveBeenCalledWith("Application error occurred");
            expect(mockReply.notFound).not.toHaveBeenCalled();
            expect(mockReply.unauthorized).not.toHaveBeenCalled();
            expect(mockReply.badRequest).not.toHaveBeenCalled();
            expect(mockReply.conflict).not.toHaveBeenCalled();
        });

        it("should handle unknown errors with generic message", () => {
            // Arrange
            const error = new Error("Some unexpected error");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.internalServerError).toHaveBeenCalledWith("Internal Server Error");
            expect(mockReply.log.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    request: expect.any(Object),
                    error,
                }),
                "Unhandled error occurred",
            );
        });
    });

    describe("handleNotFound", () => {
        it("should not throw when entity exists", () => {
            // Arrange
            const entity = { id: "123", name: "Test" };

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test")).not.toThrow();
        });

        it("should throw NotFoundException when entity is null", () => {
            // Arrange
            const entity = null;

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test"))
                .toThrow(NotFoundException);
            expect(() => handleNotFound(entity, "123", "test"))
                .toThrow("Test with id 123 not found");
        });

        it("should throw NotFoundException when entity is undefined", () => {
            // Arrange
            const entity = undefined;

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test"))
                .toThrow(NotFoundException);
        });

        it("should format entity name correctly in error message", () => {
            // Arrange
            const entity = undefined;

            // Act & Assert - test with different entity names
            expect(() => handleNotFound(entity, "123", "user"))
                .toThrow("User with id 123 not found");

            expect(() => handleNotFound(entity, "456", "product-category"))
                .toThrow("ProductCategory with id 456 not found");
        });
    });
});
