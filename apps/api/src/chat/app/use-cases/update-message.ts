import { UpdateMessageSchema } from "@dipcord/schema";

import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { UpdateMessageParams, UpdateMessageUseCase } from "../ports/incoming.js";
import type { MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createUpdateMessageUseCase(messageRepository: MessageRepository, notificationService: NotificationService): UpdateMessageUseCase {
    return {
        async execute(params: UpdateMessageParams) {
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError(`Message with ID ${params.messageId} not found`);
            }

            if (message.userId !== params.userId) {
                throw new ForbiddenError("Only the author can edit this message");
            }

            if (message.isDeleted) {
                throw new BadRequestError("Cannot edit deleted message");
            }

            const updatedMessage = await messageRepository.updateMessage(params.messageId, params.content);

            await notificationService.notifyMessageUpdated(updatedMessage);

            return updatedMessage;
        },
    };
}
