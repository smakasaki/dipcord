import { ToggleReactionSchema } from "@dipcord/schema";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { ToggleReactionParams, ToggleReactionResult, ToggleReactionUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, MessageRepository, NotificationService, ReactionRepository } from "../ports/outgoing.js";

export function createToggleReactionUseCase(messageRepository: MessageRepository, reactionRepository: ReactionRepository, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): ToggleReactionUseCase {
    return {
        async execute(params: ToggleReactionParams): Promise<ToggleReactionResult> {
        // 1. Validate parameters
            const validator = TypeCompiler.Compile(ToggleReactionSchema);
            if (!validator.Check(params)) {
                const errors = [...validator.Errors(params)];
                throw new BadRequestError(`Invalid parameters: ${JSON.stringify(errors)}`);
            }

            // 2. Get the message
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError("Message not found");
            }

            // 3. Check if user is a member of the channel
            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, message.channelId);
            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            // 4. Check if message is deleted
            if (message.isDeleted) {
                throw new BadRequestError("Cannot react to deleted message");
            }

            // 5. Get existing reactions for this user on this message
            const existingReactions = await reactionRepository.getReactionsByMessageId(params.messageId);
            const existingUserReaction = existingReactions.find(
                r => r.userId === params.userId && r.emoji === params.emoji,
            );

            let result: ToggleReactionResult;

            // 6. Toggle reaction (add or remove)
            if (existingUserReaction) {
            // Remove reaction
                await reactionRepository.deleteReaction(params.messageId, params.userId, params.emoji);
                result = {
                    action: "remove",
                    reaction: null,
                };
            }
            else {
            // Add reaction
                const reaction = await reactionRepository.createReaction({
                    messageId: params.messageId,
                    userId: params.userId,
                    emoji: params.emoji,
                });
                result = {
                    action: "add",
                    reaction,
                };
            }

            // 7. Send notification
            await notificationService.notifyReactionToggled(
                result.reaction,
                result.action,
            );

            return result;
        },
    };
}
