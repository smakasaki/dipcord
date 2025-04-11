import { GetChannelMessagesSchema } from "@dipcord/schema";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { BadRequestError, ForbiddenError } from "#commons/app/errors.js";

import type { GetChannelMessagesParams, GetChannelMessagesResult, GetChannelMessagesUseCase } from "../ports/incoming.js";
import type { AttachmentRepository, ChannelMemberRepository, MessageRepository, ReactionRepository } from "../ports/outgoing.js";

export function createGetChannelMessagesUseCase(messageRepository: MessageRepository, attachmentRepository: AttachmentRepository, reactionRepository: ReactionRepository, channelMemberRepository: ChannelMemberRepository): GetChannelMessagesUseCase {
    return {
        async execute(params: GetChannelMessagesParams): Promise<GetChannelMessagesResult> {
        // 1. Validate parameters
            const validator = TypeCompiler.Compile(GetChannelMessagesSchema);
            if (!validator.Check(params)) {
                const errors = [...validator.Errors(params)];
                throw new BadRequestError(`Invalid parameters: ${JSON.stringify(errors)}`);
            }

            // 2. Check if user is a member of the channel
            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, params.channelId);
            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            // 3. Prepare pagination params
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

            // 4. Get messages
            const { data: messages, nextCursor } = await messageRepository.getMessages(paginationParams);

            // 5. Get attachments for all messages
            const messageIds = messages.map(message => message.id);
            const attachmentsPromises = messageIds.map(messageId =>
                attachmentRepository.getAttachmentsByMessageId(messageId),
            );

            const attachmentsArrays = await Promise.all(attachmentsPromises);
            const attachments = messageIds.reduce((acc, messageId, index) => {
                acc[messageId] = attachmentsArrays[index] ?? [];
                return acc;
            }, {} as Record<string, any[]>);

            // 6. Get reactions for all messages
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
