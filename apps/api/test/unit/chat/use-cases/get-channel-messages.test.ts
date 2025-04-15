import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGetChannelMessagesUseCase } from "#chat/app/use-cases/get-channel-messages.js";
import { ForbiddenError } from "#commons/app/errors.js";

// Mock dependencies
const mockMessageRepository = {
    createMessage: vi.fn(),
    getMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    getMessages: vi.fn(),
};

const mockAttachmentRepository = {
    createAttachments: vi.fn(),
    getAttachmentsByMessageId: vi.fn(),
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

describe("getChannelMessagesUseCase", () => {
    const getChannelMessagesUseCase = createGetChannelMessagesUseCase(
        mockMessageRepository,
        mockAttachmentRepository,
        mockReactionRepository,
        mockChannelMemberRepository,
    );

    const testUserId = randomUUID();
    const testChannelId = randomUUID();

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully get channel messages with attachments and reactions", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            limit: 20,
            cursor: undefined,
            sort: "newest" as const,
        };

        const messageId1 = randomUUID();
        const messageId2 = randomUUID();

        const messages = [
            {
                id: messageId1,
                channelId: testChannelId,
                userId: testUserId,
                content: "Message 1",
                createdAt: new Date(),
                updatedAt: new Date(),
                isEdited: false,
                parentMessageId: null,
                isDeleted: false,
            },
            {
                id: messageId2,
                channelId: testChannelId,
                userId: randomUUID(),
                content: "Message 2",
                createdAt: new Date(),
                updatedAt: new Date(),
                isEdited: false,
                parentMessageId: null,
                isDeleted: false,
            },
        ];

        const nextCursor = "next-page-cursor";

        const attachments1 = [
            {
                id: randomUUID(),
                messageId: messageId1,
                fileName: "file1.jpg",
                fileType: "image/jpeg",
                size: 1024,
                s3Location: "s3://bucket/file1.jpg",
                createdAt: new Date(),
            },
        ];

        const attachments2: Array<any> = [];

        const reactions = [
            {
                id: randomUUID(),
                messageId: messageId1,
                userId: randomUUID(),
                emoji: "👍",
                createdAt: new Date(),
            },
            {
                id: randomUUID(),
                messageId: messageId2,
                userId: testUserId,
                emoji: "❤️",
                createdAt: new Date(),
            },
        ];

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.getMessages.mockResolvedValue({
            data: messages,
            nextCursor,
        });
        mockAttachmentRepository.getAttachmentsByMessageId
            .mockResolvedValueOnce(attachments1)
            .mockResolvedValueOnce(attachments2);
        mockReactionRepository.getReactionsByMessageIds.mockResolvedValue(reactions);

        // Act
        const result = await getChannelMessagesUseCase.execute(params);

        // Assert
        expect(mockChannelMemberRepository.isUserChannelMember).toHaveBeenCalledWith(testUserId, testChannelId);
        expect(mockMessageRepository.getMessages).toHaveBeenCalledWith({
            limit: 20,
            cursor: undefined,
            sort: "newest",
            filters: {
                channelId: testChannelId,
                parentMessageId: undefined,
                includeDeleted: false,
            },
        });
        expect(mockAttachmentRepository.getAttachmentsByMessageId).toHaveBeenCalledTimes(2);
        expect(mockReactionRepository.getReactionsByMessageIds).toHaveBeenCalledWith([messageId1, messageId2]);

        expect(result).toEqual({
            messages,
            nextCursor,
            attachments: {
                [messageId1]: attachments1,
                [messageId2]: attachments2,
            },
            reactions,
        });
    });

    it("should get messages with parent message filter", async () => {
        // Arrange
        const parentMessageId = randomUUID();
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            parentMessageId,
            limit: 50,
        };

        const messageId = randomUUID();
        const messages = [
            {
                id: messageId,
                channelId: testChannelId,
                userId: testUserId,
                content: "Reply message",
                createdAt: new Date(),
                updatedAt: new Date(),
                isEdited: false,
                parentMessageId,
                isDeleted: false,
            },
        ];

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.getMessages.mockResolvedValue({
            data: messages,
            nextCursor: null,
        });
        mockAttachmentRepository.getAttachmentsByMessageId.mockResolvedValue([]);
        mockReactionRepository.getReactionsByMessageIds.mockResolvedValue([]);

        // Act
        const result = await getChannelMessagesUseCase.execute(params);

        // Assert
        expect(mockMessageRepository.getMessages).toHaveBeenCalledWith({
            limit: 50,
            cursor: undefined,
            sort: "newest",
            filters: {
                channelId: testChannelId,
                parentMessageId,
                includeDeleted: false,
            },
        });

        expect(result).toEqual({
            messages,
            nextCursor: null,
            attachments: {
                [messageId]: [],
            },
            reactions: [],
        });
    });

    it("should throw ForbiddenError if user is not a channel member", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            limit: 20,
        };

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(false);

        // Act & Assert
        await expect(getChannelMessagesUseCase.execute(params)).rejects.toThrow(ForbiddenError);
        expect(mockMessageRepository.getMessages).not.toHaveBeenCalled();
    });

    it("should correctly apply includeDeleted filter when specified", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            includeDeleted: true,
        };

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.getMessages.mockResolvedValue({
            data: [],
            nextCursor: null,
        });
        mockReactionRepository.getReactionsByMessageIds.mockResolvedValue([]);

        // Act
        await getChannelMessagesUseCase.execute(params);

        // Assert
        expect(mockMessageRepository.getMessages).toHaveBeenCalledWith({
            limit: 50,
            cursor: undefined,
            sort: "newest",
            filters: {
                channelId: testChannelId,
                parentMessageId: undefined,
                includeDeleted: true,
            },
        });
    });
});
