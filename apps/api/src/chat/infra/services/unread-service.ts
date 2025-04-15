import type { RedisClientType } from "redis";

/**
 * Unread messages tracking service
 * Uses Redis to track unread messages for users in channels
 */
export class UnreadMessageService {
    constructor(private readonly redis: RedisClientType) {}

    /**
     * Get the key for storing unread message counts
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Redis key
     */
    private getUnreadCountKey(channelId: string, userId: string): string {
        return `channel:${channelId}:user:${userId}:unread`;
    }

    /**
     * Get the key for storing last read message ID
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Redis key
     */
    private getLastReadKey(channelId: string, userId: string): string {
        return `channel:${channelId}:user:${userId}:lastread`;
    }

    /**
     * Increment unread message count for all users in a channel except the sender
     * @param channelId Channel ID
     * @param senderId User ID of the message sender (to exclude)
     * @param userIds All user IDs in the channel
     */
    async incrementUnreadCount(channelId: string, senderId: string, userIds: string[]): Promise<void> {
        const pipeline = this.redis.multi();

        for (const userId of userIds) {
            if (userId !== senderId) {
                pipeline.incr(this.getUnreadCountKey(channelId, userId));
            }
        }

        await pipeline.exec();
    }

    /**
     * Mark messages as read up to a specific message ID
     * @param channelId Channel ID
     * @param userId User ID
     * @param messageId Message ID that was read
     */
    async markAsRead(channelId: string, userId: string, messageId: string): Promise<void> {
        const pipeline = this.redis.multi();

        pipeline.set(this.getUnreadCountKey(channelId, userId), "0");
        pipeline.set(this.getLastReadKey(channelId, userId), messageId);

        await pipeline.exec();
    }

    /**
     * Get unread message count for a user in a channel
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Unread message count
     */
    async getUnreadCount(channelId: string, userId: string): Promise<number> {
        const count = await this.redis.get(this.getUnreadCountKey(channelId, userId));
        return count ? Number.parseInt(count, 10) : 0;
    }

    /**
     * Get last read message ID for a user in a channel
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Last read message ID or null if none
     */
    async getLastReadMessageId(channelId: string, userId: string): Promise<string | null> {
        return this.redis.get(this.getLastReadKey(channelId, userId));
    }

    /**
     * Reset unread counts for a channel (e.g. when channel is deleted)
     * @param channelId Channel ID
     * @param userIds All user IDs in the channel
     */
    async resetUnreadCounts(channelId: string, userIds: string[]): Promise<void> {
        const pipeline = this.redis.multi();

        for (const userId of userIds) {
            pipeline.del(this.getUnreadCountKey(channelId, userId));
            pipeline.del(this.getLastReadKey(channelId, userId));
        }

        await pipeline.exec();
    }

    /**
     * Get unread counts for all channels for a user
     * @param userId User ID
     * @param channelIds Channel IDs to check
     * @returns Map of channel ID to unread count
     */
    async getUnreadCountsForUser(userId: string, channelIds: string[]): Promise<Record<string, number>> {
        const pipeline = this.redis.multi();

        // Queue all GET operations
        for (const channelId of channelIds) {
            pipeline.get(this.getUnreadCountKey(channelId, userId));
        }

        // Execute and process results
        const results = await pipeline.exec();

        if (!results)
            return {};

        // Create a map of channel ID to unread count
        return channelIds.reduce((acc, channelId, index) => {
            const count = results[index] !== null ? Number.parseInt(results[index] as string, 10) || 0 : 0;
            acc[channelId] = count;
            return acc;
        }, {} as Record<string, number>);
    }
}
