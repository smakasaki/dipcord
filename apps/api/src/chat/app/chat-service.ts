import type { AttachmentRepository, ChannelMemberRepository, MentionExtractor, MentionRepository, MessageRepository, NotificationService, ReactionRepository } from "./ports/outgoing.js";
import type { S3Service } from "./use-cases/upload-attachment.js";

import { createDeleteMessageUseCase } from "./use-cases/delete-message.js";
import { createGetAttachmentByIdUseCase } from "./use-cases/get-attachment-by-id.js";
import { createGetChannelMessagesUseCase } from "./use-cases/get-channel-messages.js";
import { createGetMessageByIdUseCase } from "./use-cases/get-message-by-id.js";
import { createGetUserMentionsUseCase } from "./use-cases/get-user-mentions.js";
import { createSendMessageUseCase } from "./use-cases/send-message.js";
import { createToggleReactionUseCase } from "./use-cases/toggle-reaction.js";
import { createUpdateMessageUseCase } from "./use-cases/update-message.js";
import { createUploadAttachmentUseCase } from "./use-cases/upload-attachment.js";

export type ChatServiceDependencies = {
    messageRepository: MessageRepository;
    attachmentRepository: AttachmentRepository;
    reactionRepository: ReactionRepository;
    mentionRepository: MentionRepository;
    mentionExtractor: MentionExtractor;
    channelMemberRepository: ChannelMemberRepository;
    notificationService: NotificationService;
    s3Service: S3Service;
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

    const getMessageByIdUseCase = createGetMessageByIdUseCase(
        deps.messageRepository,
        deps.attachmentRepository,
        deps.reactionRepository,
        deps.channelMemberRepository,
    );

    const getUserMentionsUseCase = createGetUserMentionsUseCase(
        deps.messageRepository,
    );

    const getAttachmentByIdUseCase = createGetAttachmentByIdUseCase(
        deps.attachmentRepository,
        deps.messageRepository,
        deps.channelMemberRepository,
    );

    const uploadAttachmentUseCase = createUploadAttachmentUseCase(
        deps.s3Service,
    );

    // Return the public API of the service
    return {
        sendMessage: sendMessageUseCase.execute,
        getChannelMessages: getChannelMessagesUseCase.execute,
        updateMessage: updateMessageUseCase.execute,
        deleteMessage: deleteMessageUseCase.execute,
        toggleReaction: toggleReactionUseCase.execute,
        getMessageById: getMessageByIdUseCase.execute,
        getUserMentions: getUserMentionsUseCase.execute,
        getAttachmentById: getAttachmentByIdUseCase.execute,
        uploadAttachment: uploadAttachmentUseCase.execute,
    };
}

export type ChatService = ReturnType<typeof createChatService>;
