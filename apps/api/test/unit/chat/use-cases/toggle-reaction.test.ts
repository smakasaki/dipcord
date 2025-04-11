import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createToggleReactionUseCase } from "#chat/app/use-cases/toggle-reaction.js";
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

const mockReactionRepository = {
    getReactionsByMessageId: vi.fn(),
    getReactionsByMessageIds: vi.fn(),
    createReaction: vi.fn(),
    deleteReaction: vi.fn(),
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

describe("toggleReactionUseCase", () => {
    const toggleReactionUseCase = createToggleReactionUseCase(
        mockMessageRepository,
        mockReactionRepository,
        mockChannelMemberRepository,
        mockNotificationService,
    );

    const testUserId = randomUUID();
    const testMessageId = randomUUID();
    const testChannelId = randomUUID();
    const testEmoji = "👍";

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should add a reaction when it doesn't exist", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            emoji: testEmoji,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: testUserId,
            content: "Test message",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const createdReaction = {
            id: randomUUID(),
            messageId: testMessageId,
            userId: testUserId,
            emoji: testEmoji,
            createdAt: new Date(),
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockReactionRepository.getReactionsByMessageId.mockResolvedValue([]);
        mockReactionRepository.createReaction.mockResolvedValue(createdReaction);

        // Act
        const result = await toggleReactionUseCase.execute(params);

        // Assert
        expect(mockMessageRepository.getMessage).toHaveBeenCalledWith(testMessageId);
        expect(mockChannelMemberRepository.isUserChannelMember).toHaveBeenCalledWith(testUserId, testChannelId);
        expect(mockReactionRepository.getReactionsByMessageId).toHaveBeenCalledWith(testMessageId);
        expect(mockReactionRepository.createReaction).toHaveBeenCalledWith({
            messageId: testMessageId,
            userId: testUserId,
            emoji: testEmoji,
        });
        expect(mockNotificationService.notifyReactionToggled).toHaveBeenCalledWith(
            createdReaction,
            "add",
        );
        expect(result).toEqual({
            action: "add",
            reaction: createdReaction,
        });
    });

    it("should remove a reaction when it exists", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            emoji: testEmoji,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Test message",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const existingReaction = {
            id: randomUUID(),
            messageId: testMessageId,
            userId: testUserId,
            emoji: testEmoji,
            createdAt: new Date(),
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockReactionRepository.getReactionsByMessageId.mockResolvedValue([existingReaction]);
        mockReactionRepository.deleteReaction.mockResolvedValue(undefined);

        // Act
        const result = await toggleReactionUseCase.execute(params);

        // Assert
        expect(mockReactionRepository.deleteReaction).toHaveBeenCalledWith(
            testMessageId,
            testUserId,
            testEmoji,
        );
        expect(mockNotificationService.notifyReactionToggled).toHaveBeenCalledWith(
            null,
            "remove",
        );
        expect(result).toEqual({
            action: "remove",
            reaction: null,
        });
    });

    it("should throw NotFoundError if message doesn't exist", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            emoji: testEmoji,
        };

        mockMessageRepository.getMessage.mockResolvedValue(null);

        // Act & Assert
        await expect(toggleReactionUseCase.execute(params)).rejects.toThrow(NotFoundError);
        expect(mockReactionRepository.createReaction).not.toHaveBeenCalled();
        expect(mockReactionRepository.deleteReaction).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError if user is not a channel member", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            emoji: testEmoji,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Test message",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(false);

        // Act & Assert
        await expect(toggleReactionUseCase.execute(params)).rejects.toThrow(ForbiddenError);
        expect(mockReactionRepository.createReaction).not.toHaveBeenCalled();
        expect(mockReactionRepository.deleteReaction).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError if message is deleted", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            messageId: testMessageId,
            emoji: testEmoji,
        };

        const message = {
            id: testMessageId,
            channelId: testChannelId,
            userId: "different-user-id",
            content: "Test message",
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: true,
        };

        mockMessageRepository.getMessage.mockResolvedValue(message);
        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);

        // Act & Assert
        await expect(toggleReactionUseCase.execute(params)).rejects.toThrow(BadRequestError);
        expect(mockReactionRepository.createReaction).not.toHaveBeenCalled();
        expect(mockReactionRepository.deleteReaction).not.toHaveBeenCalled();
    });
});
