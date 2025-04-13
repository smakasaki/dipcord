import { BadRequestError, ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { ToggleReactionParams, ToggleReactionResult, ToggleReactionUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, MessageRepository, NotificationService, ReactionRepository } from "../ports/outgoing.js";

export function createToggleReactionUseCase(messageRepository: MessageRepository, reactionRepository: ReactionRepository, channelMemberRepository: ChannelMemberRepository, notificationService: NotificationService): ToggleReactionUseCase {
    return {
        async execute(params: ToggleReactionParams): Promise<ToggleReactionResult> {
            const message = await messageRepository.getMessage(params.messageId);
            if (!message) {
                throw new NotFoundError(`Message with ID ${params.messageId} not found`);
            }

            const isMember = await channelMemberRepository.isUserChannelMember(params.userId, message.channelId);
            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            if (message.isDeleted) {
                throw new BadRequestError("Cannot react to deleted message");
            }

            const existingReactions = await reactionRepository.getReactionsByMessageId(params.messageId);
            const existingUserReaction = existingReactions.find(
                r => r.userId === params.userId && r.emoji === params.emoji,
            );

            let result: ToggleReactionResult;

            if (existingUserReaction) {
                await reactionRepository.deleteReaction(params.messageId, params.userId, params.emoji);
                result = {
                    action: "remove",
                    reaction: null,
                };
            }
            else {
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

            await notificationService.notifyReactionToggled(
                result.reaction,
                result.action,
            );

            return result;
        },
    };
}
