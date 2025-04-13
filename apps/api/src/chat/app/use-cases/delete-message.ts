import { DeleteMessageSchema } from "@dipcord/schema";

import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { DeleteMessageParams, DeleteMessageUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createDeleteMessageUseCase(messageRepository: MessageRepository, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): DeleteMessageUseCase {
    return {
        async execute(params: DeleteMessageParams) {
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError(`Message with ID ${params.messageId} not found`);
            }

            let hasPermission = message.userId === params.userId;

            if (!hasPermission) {
                const userRole = await channelMemberRepository.getUserPermissionsInChannel(
                    params.userId,
                    message.channelId,
                );

                if (!userRole) {
                    throw new ForbiddenError("User is not a member of this channel");
                }

                hasPermission
                = userRole.role === "owner"
                    || (userRole.role === "moderator" && userRole.permissions?.manage_messages === true);
            }

            if (!hasPermission) {
                throw new ForbiddenError("You don't have permission to delete this message");
            }

            const deletedMessage = await messageRepository.deleteMessage(params.messageId);

            await notificationService.notifyMessageDeleted(deletedMessage);

            return deletedMessage;
        },
    };
}
