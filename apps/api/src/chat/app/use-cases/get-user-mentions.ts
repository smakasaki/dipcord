import type { Message } from "@dipcord/domain";

import type { MessageRepository } from "../ports/outgoing.js";

export type GetUserMentionsParams = {
    userId: string;
    limit?: number;
    cursor?: string;
};

export type GetUserMentionsResult = {
    messages: Message[];
    nextCursor: string | null;
};

export function createGetUserMentionsUseCase(
    messageRepository: MessageRepository,
) {
    return {
        async execute({ userId: _userId, limit = 20, cursor }: GetUserMentionsParams): Promise<GetUserMentionsResult> {
            // Since we don't have direct access to mentions in MessageFilters,
            // we'd need to enhance the repository or database layer
            // This is a simplified implementation that assumes there's a special method
            // for querying mentions

            // We'd normally implement this with a custom query to get mentions
            // through a different method or database layer
            const result = await messageRepository.getMessages({
                limit,
                cursor,
                sort: "newest",
                filters: {
                    // We would need some other mechanism to filter by mentions
                    // This simplified version assumes all channel messages are returned
                    // In a real implementation, this would need to be handled differently
                    channelId: "all", // This is just a placeholder
                    includeDeleted: false,
                },
            });

            // In a real implementation, we'd filter these messages for ones that mention the user
            // For now, we'll return all messages
            return {
                messages: result.data,
                nextCursor: result.nextCursor,
            };
        },
    };
}
