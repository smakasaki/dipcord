import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSendMessageUseCase } from "#chat/app/use-cases/send-message.js";
import { BadRequestError } from "#commons/app/errors.js";

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

const mockAttachmentRepository = {
    createAttachments: vi.fn(),
    getAttachmentsByMessageId: vi.fn(),
};

const mockMentionRepository = {
    createMentions: vi.fn(),
    getMentionsByMessageId: vi.fn(),
    getMentionsByMessageIds: vi.fn(),
};

const mockMentionExtractor = {
    extractMentions: vi.fn(),
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

describe("sendMessageUseCase", () => {
    const sendMessageUseCase = createSendMessageUseCase(
        mockMessageRepository,
        mockAttachmentRepository,
        mockMentionRepository,
        mockMentionExtractor,
        mockChannelMemberRepository,
        mockNotificationService,
    );

    const testUserId = randomUUID();
    const testChannelId = randomUUID();
    const testMessageId = "65d6c274-b6ad-4410-a038-a7f003dc35b9";
    const testContent = "Hello, world!";

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully create a message", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            content: testContent,
        };

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.createMessage.mockResolvedValue({
            id: testMessageId,
            channelId: testChannelId,
            userId: testUserId,
            content: testContent,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        });
        mockMentionExtractor.extractMentions.mockReturnValue([]);
        mockAttachmentRepository.createAttachments.mockResolvedValue([]);

        // Act
        const result = await sendMessageUseCase.execute(params);

        // Assert
        expect(mockChannelMemberRepository.isUserChannelMember).toHaveBeenCalledWith(testUserId, testChannelId);
        expect(mockMessageRepository.createMessage).toHaveBeenCalledWith({
            channelId: testChannelId,
            userId: testUserId,
            content: testContent,
            parentMessageId: null,
            isDeleted: false,
        });
        expect(mockNotificationService.notifyMessageCreated).toHaveBeenCalled();
        expect(result.message.id).toBe(testMessageId);
        expect(result.attachments).toEqual([]);
    });

    it("should create message with attachments", async () => {
        // Arrange
        const attachments = [
            {
                fileName: "test.jpg",
                fileType: "image/jpeg",
                size: 1024,
                s3Location: "s3://bucket/test.jpg",
            },
        ];

        const params = {
            userId: testUserId,
            channelId: testChannelId,
            content: testContent,
            attachments,
        };

        const createdMessage = {
            id: testMessageId,
            channelId: testChannelId,
            userId: testUserId,
            content: testContent,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        };

        const createdAttachments = [
            {
                id: "attachment-123",
                messageId: testMessageId,
                fileName: "test.jpg",
                fileType: "image/jpeg",
                size: 1024,
                s3Location: "s3://bucket/test.jpg",
                createdAt: new Date(),
            },
        ];

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.createMessage.mockResolvedValue(createdMessage);
        mockAttachmentRepository.createAttachments.mockResolvedValue(createdAttachments);
        mockMentionExtractor.extractMentions.mockReturnValue([]);

        // Act
        const result = await sendMessageUseCase.execute(params);

        // Assert
        expect(mockAttachmentRepository.createAttachments).toHaveBeenCalledWith([
            {
                messageId: testMessageId,
                fileName: "test.jpg",
                fileType: "image/jpeg",
                size: 1024,
                s3Location: "s3://bucket/test.jpg",
            },
        ]);
        expect(result.message).toEqual(createdMessage);
        expect(result.attachments).toEqual(createdAttachments);
    });

    it("should extract and save mentions", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            content: "Hello @user1 and @user2",
        };

        const mentionedUserIds = ["user1", "user2"];

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(true);
        mockMessageRepository.createMessage.mockResolvedValue({
            id: testMessageId,
            channelId: testChannelId,
            userId: testUserId,
            content: params.content,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            parentMessageId: null,
            isDeleted: false,
        });
        mockMentionExtractor.extractMentions.mockReturnValue(mentionedUserIds);
        mockAttachmentRepository.createAttachments.mockResolvedValue([]);

        // Act
        await sendMessageUseCase.execute(params);

        // Assert
        expect(mockMentionExtractor.extractMentions).toHaveBeenCalledWith(params.content);
        expect(mockMentionRepository.createMentions).toHaveBeenCalledWith([
            { messageId: testMessageId, mentionedUserId: "user1" },
            { messageId: testMessageId, mentionedUserId: "user2" },
        ]);
    });

    it("should throw error if user is not channel member", async () => {
        // Arrange
        const params = {
            userId: testUserId,
            channelId: testChannelId,
            content: testContent,
        };

        mockChannelMemberRepository.isUserChannelMember.mockResolvedValue(false);

        // Act & Assert
        await expect(sendMessageUseCase.execute(params)).rejects.toThrow(BadRequestError);
        expect(mockMessageRepository.createMessage).not.toHaveBeenCalled();
    });
});
