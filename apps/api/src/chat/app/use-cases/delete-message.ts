import { DeleteMessageSchema } from "@dipcord/schema";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { DeleteMessageParams, DeleteMessageUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createDeleteMessageUseCase(messageRepository: MessageRepository, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): DeleteMessageUseCase {
    return {
        async execute(params: DeleteMessageParams) {
        // 1. Validate parameters
            const validator = TypeCompiler.Compile(DeleteMessageSchema);
            if (!validator.Check(params)) {
                const errors = [...validator.Errors(params)];
                throw new BadRequestError(`Invalid parameters: ${JSON.stringify(errors)}`);
            }

            // 2. Get the message
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError("Message not found");
            }

            // 3. Check permissions
            // - User is message author
            // - User is channel owner
            // - User is moderator with manage_messages permission
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

            // 4. Delete message
            const deletedMessage = await messageRepository.deleteMessage(params.messageId);

            // 5. Notify about the deletion
            await notificationService.notifyMessageDeleted(deletedMessage);

            return deletedMessage;
        },
    };
}
