import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatService, ChatServiceDependencies } from "#chat/app/chat-service.js";

import { createChatService } from "#chat/app/chat-service.js";
import { createDeleteMessageUseCase } from "#chat/app/use-cases/delete-message.js";
import { createGetChannelMessagesUseCase } from "#chat/app/use-cases/get-channel-messages.js";
import { createSendMessageUseCase } from "#chat/app/use-cases/send-message.js";
import { createToggleReactionUseCase } from "#chat/app/use-cases/toggle-reaction.js";
import { createUpdateMessageUseCase } from "#chat/app/use-cases/update-message.js";

// Mock the use case factories
vi.mock("#chat/app/use-cases/send-message.js", () => ({
    createSendMessageUseCase: vi.fn(() => ({
        execute: vi.fn().mockImplementation(params => ({ type: "send-message", params })),
    })),
}));

vi.mock("#chat/app/use-cases/get-channel-messages.js", () => ({
    createGetChannelMessagesUseCase: vi.fn(() => ({
        execute: vi.fn().mockImplementation(params => ({ type: "get-channel-messages", params })),
    })),
}));

vi.mock("#chat/app/use-cases/update-message.js", () => ({
    createUpdateMessageUseCase: vi.fn(() => ({
        execute: vi.fn().mockImplementation(params => ({ type: "update-message", params })),
    })),
}));

vi.mock("#chat/app/use-cases/delete-message.js", () => ({
    createDeleteMessageUseCase: vi.fn(() => ({
        execute: vi.fn().mockImplementation(params => ({ type: "delete-message", params })),
    })),
}));

vi.mock("#chat/app/use-cases/toggle-reaction.js", () => ({
    createToggleReactionUseCase: vi.fn(() => ({
        execute: vi.fn().mockImplementation(params => ({ type: "toggle-reaction", params })),
    })),
}));

describe("chatServiceFacade", () => {
    // Mock dependencies
    const mockDependencies: ChatServiceDependencies = {
        messageRepository: {
            createMessage: vi.fn(),
            getMessage: vi.fn(),
            updateMessage: vi.fn(),
            deleteMessage: vi.fn(),
            getMessages: vi.fn(),
        },
        attachmentRepository: {
            createAttachments: vi.fn(),
            getAttachmentsByMessageId: vi.fn(),
        },
        reactionRepository: {
            getReactionsByMessageId: vi.fn(),
            getReactionsByMessageIds: vi.fn(),
            createReaction: vi.fn(),
            deleteReaction: vi.fn(),
        },
        mentionRepository: {
            createMentions: vi.fn(),
            getMentionsByMessageId: vi.fn(),
            getMentionsByMessageIds: vi.fn(),
        },
        mentionExtractor: {
            extractMentions: vi.fn(),
        },
        channelMemberRepository: {
            isUserChannelMember: vi.fn(),
            getUserPermissionsInChannel: vi.fn(),
        },
        notificationService: {
            notifyMessageCreated: vi.fn(),
            notifyMessageUpdated: vi.fn(),
            notifyMessageDeleted: vi.fn(),
            notifyReactionToggled: vi.fn(),
        },
    };

    let chatService: ChatService;

    beforeEach(() => {
        vi.resetAllMocks();
        chatService = createChatService(mockDependencies);
    });

    it("should initialize all use cases with correct dependencies", () => {
        // Check that the factories were called with the correct dependencies
        expect(createSendMessageUseCase).toHaveBeenCalledWith(
            mockDependencies.messageRepository,
            mockDependencies.attachmentRepository,
            mockDependencies.mentionRepository,
            mockDependencies.mentionExtractor,
            mockDependencies.channelMemberRepository,
            mockDependencies.notificationService,
        );

        expect(createGetChannelMessagesUseCase).toHaveBeenCalledWith(
            mockDependencies.messageRepository,
            mockDependencies.attachmentRepository,
            mockDependencies.reactionRepository,
            mockDependencies.channelMemberRepository,
        );

        expect(createUpdateMessageUseCase).toHaveBeenCalledWith(
            mockDependencies.messageRepository,
            mockDependencies.notificationService,
        );

        expect(createDeleteMessageUseCase).toHaveBeenCalledWith(
            mockDependencies.messageRepository,
            mockDependencies.channelMemberRepository,
            mockDependencies.notificationService,
        );

        expect(createToggleReactionUseCase).toHaveBeenCalledWith(
            mockDependencies.messageRepository,
            mockDependencies.reactionRepository,
            mockDependencies.channelMemberRepository,
            mockDependencies.notificationService,
        );
    });

    it("should expose all use cases through the public API", () => {
        expect(chatService).toHaveProperty("sendMessage");
        expect(chatService).toHaveProperty("getChannelMessages");
        expect(chatService).toHaveProperty("updateMessage");
        expect(chatService).toHaveProperty("deleteMessage");
        expect(chatService).toHaveProperty("toggleReaction");
    });

    it("should properly delegate to sendMessage use case", async () => {
        const params = { userId: "123", channelId: "456", content: "Test message" };
        const result = await chatService.sendMessage(params);
        expect(result).toEqual({ type: "send-message", params });
    });

    it("should properly delegate to getChannelMessages use case", async () => {
        const params = { userId: "123", channelId: "456", limit: 50 };
        const result = await chatService.getChannelMessages(params);
        expect(result).toEqual({ type: "get-channel-messages", params });
    });

    it("should properly delegate to updateMessage use case", async () => {
        const params = { userId: "123", messageId: "789", content: "Updated content" };
        const result = await chatService.updateMessage(params);
        expect(result).toEqual({ type: "update-message", params });
    });

    it("should properly delegate to deleteMessage use case", async () => {
        const params = { userId: "123", messageId: "789" };
        const result = await chatService.deleteMessage(params);
        expect(result).toEqual({ type: "delete-message", params });
    });

    it("should properly delegate to toggleReaction use case", async () => {
        const params = { userId: "123", messageId: "789", emoji: "👍" };
        const result = await chatService.toggleReaction(params);
        expect(result).toEqual({ type: "toggle-reaction", params });
    });
});
