import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeleteMessageUseCase } from "#chat/app/use-cases/delete-message.js";
import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

// Mock dependencies
const mockMessageRepository = {
    createMessage: vi.fn(),
    getMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    getMessages: vi.fn(),
};

const mockChannelMemberRepository = {
    isUserChannelMember: vi.fn(),
    getUserPermissionsInChannel: vi.fn(),
};

const mockNotificationService = {
    notifyMessageCreated: vi.fn(),
    notifyMessageUpdated: vi.fn(),
    notifyMessageDeleted: vi.fn(),
    notifyReactionToggled: vi.fn(),
};

describe("deleteMessageUseCase", () => {
    const deleteMessageUseCase = createDeleteMessageUseCase(
        mockMessageRepository,
        mockChannelMemberRepository,
        mockNotificationService,
    );

    const testUserId = randomUUID();
    const testMessageId = randomUUID();
    const testChannelId = randomUUID();

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully delete a message as the author", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: testUserId,
            content: "Message to delete",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const deletedMessage = {
            ...message,
            isDeleted: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockMessageRepository.deleteMessage.mockResolvedValue(deletedMessage);

        // Act
        const result = await deleteMessageUseCase.execute(params);

        // Assert
        expect(mockMessageRepository.getMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockMessageRepository.deleteMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockNotificationService.notifyMessageDeleted).toHaveBeenCalledWith(deletedMessage);
        expect(result).toEqual(deletedMessage);
    });

    it("should successfully delete a message as a channel owner", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Message to delete",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const deletedMessage = {
            ...message,
            isDeleted: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.getUserPermissionsInChannel.mockResolvedValue({
            role: "owner",
            permissions: {},
        });
        mockMessageRepository.deleteMessage.mockResolvedValue(deletedMessage);

        // Act
        const result = await deleteMessageUseCase.execute(params);

        // Assert
        expect(mockChannelMemberRepository.getUserPermissionsInChannel).toHaveBeenCalledWith(
            testUserId,
            testChannelId,
        );
        expect(mockMessageRepository.deleteMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockNotificationService.notifyMessageDeleted).toHaveBeenCalledWith(deletedMessage);
        expect(result).toEqual(deletedMessage);
    });

    it("should successfully delete a message as a moderator with manage_messages permission", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Message to delete",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const deletedMessage = {
            ...message,
            isDeleted: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.getUserPermissionsInChannel.mockResolvedValue({
            role: "moderator",
            permissions: {
                manage_messages: true,
            },
        });
        mockMessageRepository.deleteMessage.mockResolvedValue(deletedMessage);

        // Act
        const result = await deleteMessageUseCase.execute(params);

        // Assert
        expect(mockChannelMemberRepository.getUserPermissionsInChannel).toHaveBeenCalledWith(
            testUserId,
            testChannelId,
        );
        expect(mockMessageRepository.deleteMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockNotificationService.notifyMessageDeleted).toHaveBeenCalledWith(deletedMessage);
        expect(result).toEqual(deletedMessage);
    });

    it("should throw NotFoundError if message doesn't exist", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        mockMessageRepository.getMessage.mockResolvedValue(null);

        // Act & Assert
        await expect(deleteMessageUseCase.execute(params)).rejects.toThrow(NotFoundError);
        expect(mockMessageRepository.deleteMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageDeleted).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError if user has no permission to delete", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Message to delete",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.getUserPermissionsInChannel.mockResolvedValue({
            role: "member",
            permissions: {},
        });

        // Act & Assert
        await expect(deleteMessageUseCase.execute(params)).rejects.toThrow(ForbiddenError);
        expect(mockMessageRepository.deleteMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageDeleted).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError if user is not a channel member", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Message to delete",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.getUserPermissionsInChannel.mockResolvedValue(null);

        // Act & Assert
        await expect(deleteMessageUseCase.execute(params)).rejects.toThrow(ForbiddenError);
        expect(mockMessageRepository.deleteMessage).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyMessageDeleted).not.toHaveBeenCalled();
    });
});
