import type { AttachmentRepository, ChannelMemberRepository, MentionExtractor, MentionRepository, MessageRepository, NotificationService, ReactionRepository } from "./ports/outgoing.js";

import { createDeleteMessageUseCase } from "./use-cases/delete-message.js";
import { createGetChannelMessagesUseCase } from "./use-cases/get-channel-messages.js";
import { createSendMessageUseCase } from "./use-cases/send-message.js";
import { createToggleReactionUseCase } from "./use-cases/toggle-reaction.js";
import { createUpdateMessageUseCase } from "./use-cases/update-message.js";

export type ChatServiceDependencies = {
    messageRepository: MessageRepository;
    attachmentRepository: AttachmentRepository;
    reactionRepository: ReactionRepository;
    mentionRepository: MentionRepository;
    mentionExtractor: MentionExtractor;
    channelMemberRepository: ChannelMemberRepository;
    notificationService: NotificationService;
};

export function createChatService(deps: ChatServiceDependencies) {
    // Initialize use cases with dependencies
    const sendMessageUseCase = createSendMessageUseCase(
        deps.messageRepository,
        deps.attachmentRepository,
        deps.mentionRepository,
        deps.mentionExtractor,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    const getChannelMessagesUseCase = createGetChannelMessagesUseCase(
        deps.messageRepository,
        deps.attachmentRepository,
        deps.reactionRepository,
        deps.channelMemberRepository,
    );

    const updateMessageUseCase = createUpdateMessageUseCase(
        deps.messageRepository,
        deps.notificationService,
    );

    const deleteMessageUseCase = createDeleteMessageUseCase(
        deps.messageRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    const toggleReactionUseCase = createToggleReactionUseCase(
        deps.messageRepository,
        deps.reactionRepository,
        deps.channelMemberRepository,
        deps.notificationService,
    );

    // Return the public API of the service
    return {
        sendMessage: sendMessageUseCase.execute,
        getChannelMessages: getChannelMessagesUseCase.execute,
        updateMessage: updateMessageUseCase.execute,
        deleteMessage: deleteMessageUseCase.execute,
        toggleReaction: toggleReactionUseCase.execute,
    };
}

export type ChatService = ReturnType<typeof createChatService>;
