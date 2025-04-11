import { UpdateMessageSchema } from "@dipcord/schema";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { UpdateMessageParams, UpdateMessageUseCase } from "../ports/incoming.js";
import type { MessageRepository, NotificationService } from "../ports/outgoing.js";

export function createUpdateMessageUseCase(messageRepository: MessageRepository, notificationService: NotificationService): UpdateMessageUseCase {
    return {
        async execute(params: UpdateMessageParams) {
        // 1. Validate parameters
            const validator = TypeCompiler.Compile(UpdateMessageSchema);
            if (!validator.Check(params)) {
                const errors = [...validator.Errors(params)];
                throw new BadRequestError(`Invalid parameters: ${JSON.stringify(errors)}`);
            }

            // 2. Get the message
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError("Message not found");
            }

            // 3. Check if user is the author
            if (message.userId !== params.userId) {
                throw new ForbiddenError("Only the author can edit this message");
            }

            // 4. Check if message is deleted
            if (message.isDeleted) {
                throw new BadRequestError("Cannot edit deleted message");
            }

            // 5. Update message
            const updatedMessage = await messageRepository.updateMessage(params.messageId, params.content);

            // 6. Notify about the update
            await notificationService.notifyMessageUpdated(updatedMessage);

            return updatedMessage;
        },
    };
}
