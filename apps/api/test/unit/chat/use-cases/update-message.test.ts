import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUpdateMessageUseCase } from "#chat/app/use-cases/update-message.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

vi.mock("@sinclair/typebox/compiler", () => {
    return {
        TypeCompiler: {
            Compile: () => ({
                Check: () => true,
                Errors: () => [],
            }),
        },
    };
});

// Mock dependencies
const mockMessageRepository = {
    createMessage: vi.fn(),
    getMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    getMessages: vi.fn(),
};

const mockNotificationService = {
    notifyMessageCreated: vi.fn(),
    notifyMessageUpdated: vi.fn(),
    notifyMessageDeleted: vi.fn(),
    notifyReactionToggled: vi.fn(),
};

describe("updateMessageUseCase", () => {
    const updateMessageUseCase = createUpdateMessageUseCase(
        mockMessageRepository,
        mockNotificationService,
    );

    const testUserId = randomUUID();
    const testMessageId = randomUUID();
    const testContent = "Updated message content";

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully update a message", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            content: testContent,
        };

        const message = {
            id: testMessageId,
            channelId: randomUUID(),
            userId: testUserId,
            content: "Original content",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const updatedMessage = {
            ...message,
            content: testContent,
            updatedAt: new Date(),
            isEdited: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockMessageRepository.updateMessage.mockResolvedValue(updatedMessage);

        // Act
        const result = await updateMessageUseCase.execute(params);

        // Assert
        expect(mockMessageRepository.getMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockMessageRepository.updateMessage).toHaveBeenCalledWith(testMessageId, testContent);
        expect(mockNotificationService.notifyMessageUpdated).toHaveBeenCalledWith(updatedMessage);
        expect(result).toEqual(updatedMessage);
    });

    it("should throw NotFoundError if message doesn't exist", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            content: testContent,
        };

        mockMessageRepository.getMessage.mockResolvedValue(null);

        // Act & Assert
        await expect(updateMessageUseCase.execute(params)).rejects.toThrow(NotFoundError);
        expect(mockMessageRepository.updateMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageUpdated).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError if user is not the author", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            content: testContent,
        };

        const message = {
            id: testMessageId,
            channelId: randomUUID(),
            userId: "different-user-id",
            content: "Original content",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);

        // Act & Assert
        await expect(updateMessageUseCase.execute(params)).rejects.toThrow(ForbiddenError);
        expect(mockMessageRepository.updateMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageUpdated).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError if message is deleted", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            content: testContent,
        };

        const message = {
            id: testMessageId,
            channelId: randomUUID(),
            userId: testUserId,
            content: "Original content",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);

        // Act & Assert
        await expect(updateMessageUseCase.execute(params)).rejects.toThrow(BadRequestError);
        expect(mockMessageRepository.updateMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageUpdated).not.toHaveBeenCalled();
    });
});
