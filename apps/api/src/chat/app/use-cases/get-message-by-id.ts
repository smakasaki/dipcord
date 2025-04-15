import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { AttachmentRepository, ChannelMemberRepository, MessageRepository, ReactionRepository } from "../ports/outgoing.js";

export type GetMessageByIdParams = {
    messageId: string;
    userId?: string;
};

export type GetMessageByIdResult = {
    message: {
        id: string;
        channelId: string;
        userId: string;
        content: string | null;
        createdAt: Date;
        updatedAt: Date;
        isEdited: boolean;
        parentMessageId: string | null;
        isDeleted: boolean;
    };
    attachments: Array<{
        id: string;
        messageId: string;
        fileName: string;
        fileType: string;
        size: number;
        s3Location: string;
        createdAt: Date;
    }>;
    reactions: Array<{
        id: string;
        messageId: string;
        userId: string;
        emoji: string;
        createdAt: Date;
    }>;
};

export function createGetMessageByIdUseCase(
    messageRepository: MessageRepository,
    attachmentRepository: AttachmentRepository,
    reactionRepository: ReactionRepository,
    channelMemberRepository: ChannelMemberRepository,
) {
    return {
        async execute({ messageId, userId }: GetMessageByIdParams): Promise<GetMessageByIdResult> {
            // Get the message
            const message = await messageRepository.getMessage(messageId);

            if (!message) {
                throw new NotFoundError(`Message with ID ${messageId} not found`);
            }

            // If userId is provided, verify the user has access to the channel
            if (userId) {
                const isMember = await channelMemberRepository.isUserChannelMember(userId, message.channelId);
                if (!isMember) {
                    throw new ForbiddenError("User does not have access to this message");
                }
            }

            // Get attachments and reactions
            const attachments = await attachmentRepository.getAttachmentsByMessageId(messageId);
            const reactions = await reactionRepository.getReactionsByMessageId(messageId);

            return {
                message,
                attachments,
                reactions,
            };
        },
    };
}
