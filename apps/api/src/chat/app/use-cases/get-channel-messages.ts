import { GetChannelMessagesSchema } from "@dipcord/schema";

import { BadRequestError, ForbiddenError } from "#commons/app/errors.js";

import type { GetChannelMessagesParams, GetChannelMessagesResult, GetChannelMessagesUseCase } from "../ports/incoming.js";
import type { AttachmentRepository, ChannelMemberRepository, MessageRepository, ReactionRepository } from "../ports/outgoing.js";

export function createGetChannelMessagesUseCase(messageRepository: MessageRepository, attachmentRepository: AttachmentRepository, reactionRepository: ReactionRepository, channelMemberRepository: ChannelMemberRepository): GetChannelMessagesUseCase {
    return {
        async execute(params: GetChannelMessagesParams): Promise<GetChannelMessagesResult> {
            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, params.channelId);
            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            const paginationParams = {
                limit: params.limit || 50,
                cursor: params.cursor,
                sort: params.sort || "newest",
                filters: {
                    channelId: params.channelId,
                    parentMessageId: params.parentMessageId,
                    includeDeleted: params.includeDeleted || false,
                },
            };

            const { data: messages, nextCursor } = await messageRepository.getMessages(paginationParams);

            const messageIds = messages.map(message => message.id);
            const attachmentsPromises = messageIds.map(messageId =>
                attachmentRepository.getAttachmentsByMessageId(messageId),
            );

            const attachmentsArrays = await Promise.all(attachmentsPromises);
            const attachments = messageIds.reduce((acc, messageId, index) => {
                acc[messageId] = attachmentsArrays[index] ?? [];
                return acc;
            }, {} as Record<string, any[]>);

            const reactions = await reactionRepository.getReactionsByMessageIds(messageIds);

            return {
                messages,
                nextCursor,
                attachments,
                reactions,
            };
        },
    };
}
