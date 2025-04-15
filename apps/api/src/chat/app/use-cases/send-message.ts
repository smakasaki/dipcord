import { SendMessageSchema } from "@dipcord/schema";

import { BadRequestError } from "#commons/app/errors.js";

import type { SendMessageParams, SendMessageResult, SendMessageUseCase } from "../ports/incoming.js";
import type { AttachmentRepository, ChannelMemberRepository, MentionExtractor, MentionRepository, MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createSendMessageUseCase(messageRepository: MessageRepository, attachmentRepository: AttachmentRepository, mentionRepository: MentionRepository, mentionExtractor: MentionExtractor, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): SendMessageUseCase {
    return {
        async execute(params: SendMessageParams): Promise<SendMessageResult> {
            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, params.channelId);
            if (!isMember) {
                throw new BadRequestError("User is not a member of this channel");
            }

            const message = await messageRepository.createMessage({
                channelId: params.channelId,
                userId: params.userId,
                content: params.content,
                parentMessageId: params.parentMessageId ?? null,
                isDeleted: false,
            });

            let attachments: Array<any> = [];
            if (params.attachments && params.attachments.length > 0) {
                attachments = await attachmentRepository.createAttachments(
                    params.attachments.map(attachment => ({
                        messageId: message.id,
                        ...attachment,
                    })),
                );
            }

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

            await notificationService.notifyMessageCreated(message, attachments);

            return {
                message,
                attachments,
            };
        },
    };
}
