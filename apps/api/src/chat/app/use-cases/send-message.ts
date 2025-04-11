import { SendMessageSchema } from "@dipcord/schema";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { BadRequestError } from "#commons/app/errors.js";

import type { SendMessageParams, SendMessageResult, SendMessageUseCase } from "../ports/incoming.js";
import type { AttachmentRepository, ChannelMemberRepository, MentionExtractor, MentionRepository, MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createSendMessageUseCase(messageRepository: MessageRepository, attachmentRepository: AttachmentRepository, mentionRepository: MentionRepository, mentionExtractor: MentionExtractor, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): SendMessageUseCase {
    return {
        async execute(params: SendMessageParams): Promise<SendMessageResult> {
        // 1. Validate parameters
            const validator = TypeCompiler.Compile(SendMessageSchema);
            if (!validator.Check(params)) {
                const errors = [...validator.Errors(params)];
                throw new BadRequestError(`Invalid parameters: ${JSON.stringify(errors)}`);
            }

            // 2. Check if user is a channel member
            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, params.channelId);
            if (!isMember) {
                throw new BadRequestError("User is not a member of this channel");
            }

            // 3. Create message
            const message = await messageRepository.createMessage({
                channelId: params.channelId,
                userId: params.userId,
                content: params.content,
                parentMessageId: params.parentMessageId ?? null,
                isDeleted: false,
            });

            // 4. Process attachments if any
            let attachments: Array<any> = [];
            if (params.attachments && params.attachments.length > 0) {
                attachments = await attachmentRepository.createAttachments(
                    params.attachments.map(attachment => ({
                        messageId: message.id,
                        ...attachment,
                    })),
                );
            }

            // 5. Process mentions if content exists
            if (params.content) {
                const mentionedUserIds = mentionExtractor.extractMentions(params.content);
                if (mentionedUserIds.length > 0) {
                    await mentionRepository.createMentions(
                        mentionedUserIds.map(userId => ({
                            messageId: message.id,
                            mentionedUserId: userId,
                        })),
                    );
                }
            }

            // 6. Send notifications
            await notificationService.notifyMessageCreated(message, attachments);

            return {
                message,
                attachments,
            };
        },
    };
}
