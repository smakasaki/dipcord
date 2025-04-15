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
    id: string;
    ip: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
    query: Record<string, unknown>;
    params: Record<string, unknown>;
};

type MockReply = {
    status: (code: number) => MockReply;
    code: (code: number) => MockReply;
    send: (payload: unknown) => MockReply;
    log: {
        error: (obj: unknown) => void;
        warn: (obj: unknown) => void;
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
            id: "request-123",
            ip: "127.0.0.1",
            headers: { "content-type": "application/json", "user-agent": "test-agent" },
            body: {},
            query: {},
            params: {},
        };

        mockReply = {
            status: vi.fn().mockReturnThis(),
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            log: {
                error: vi.fn(),
                warn: vi.fn(),
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
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                error: "Not Found",
                message: "Resource not found",
            }));
            expect(mockReply.log.warn).toHaveBeenCalled();
        });

        it("should handle UnauthorizedException", () => {
            // Arrange
            const error = new UnauthorizedException("Unauthorized access");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                error: "Unauthorized",
                message: "Unauthorized access",
            }));
            expect(mockReply.log.warn).toHaveBeenCalled();
        });

        it("should handle BadRequestException", () => {
            // Arrange
            const error = new BadRequestException("Invalid request data");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                error: "Bad Request",
                message: "Invalid request data",
            }));
            expect(mockReply.log.warn).toHaveBeenCalled();
        });

        it("should handle ConflictException", () => {
            // Arrange
            const error = new ConflictException("Resource already exists");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 409,
                error: "Conflict",
                message: "Resource already exists",
            }));
            expect(mockReply.log.warn).toHaveBeenCalled();
        });

        it("should handle generic ApplicationException", () => {
            // Arrange
            const error = new ApplicationException("Application error occurred");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 500,
                error: "Internal Server Error",
                message: "Application error occurred",
            }));
            expect(mockReply.log.error).toHaveBeenCalled();
        });

        it("should handle unknown errors with generic message", () => {
            // Arrange
            const error = new Error("Some unexpected error");

            // Act
            errorHandler(asError(error), mockRequest as any, mockReply as any);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 500,
                error: "Internal Server Error",
                message: "Some unexpected error",
            }));
            expect(mockReply.log.error).toHaveBeenCalled();
        });
    });

    describe("handleNotFound", () => {
        it("should not throw when entity exists", () => {
            // Arrange
            const entity = { id: "123", name: "Test" };

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test")).not.toThrow();
        });

        it("should throw error when entity is null", () => {
            // Arrange
            const entity = null;

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test")).toThrow();
        });

        it("should throw error when entity is undefined", () => {
            // Arrange
            const entity = undefined;

            // Act & Assert
            expect(() => handleNotFound(entity, "123", "test")).toThrow();
        });
    });
});
