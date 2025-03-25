import type { RedisClientType } from "redis";

/**
 * Keys generator for Redis
 * Centralizes the creation of Redis keys
 */
export const RedisKeys = {
    /**
     * Get key for active channel users
     * @param channelId Channel ID
     * @returns Redis key
     */
    activeChannelUsers: (channelId: string) => `channel:${channelId}:active_users`,

    /**
     * Get key for user active status
     * @param userId User ID
     * @returns Redis key
     */
    userActiveStatus: (userId: string) => `user:${userId}:active_status`,

    /**
     * Get key for user's active channels
     * @param userId User ID
     * @returns Redis key
     */
    userActiveChannels: (userId: string) => `user:${userId}:active_channels`,
};

/**
 * Active Users Service
 * Handles tracking of active users in channels using Redis
 */
export class ActiveUsersService {
    /**
     * Default TTL for activity in seconds (30 minutes)
     */
    private static readonly DEFAULT_TTL = 1800;

    /**
     * Create a new ActiveUsersService
     * @param redis Redis client
     */
    constructor(private readonly redis: RedisClientType) {}

    /**
     * Mark user as active in a channel
     * @param channelId Channel ID
     * @param userId User ID
     * @param ttl TTL in seconds (default: 30 minutes)
     */
    async markUserActiveInChannel(channelId: string, userId: string, ttl = ActiveUsersService.DEFAULT_TTL): Promise<void> {
        const pipeline = this.redis.multi();

        // Add user to active users sorted set with current timestamp
        const timestamp = Date.now();
        pipeline.zAdd(RedisKeys.activeChannelUsers(channelId), {
            score: timestamp,
            value: userId,
        });

        // Set TTL for the sorted set
        pipeline.expire(RedisKeys.activeChannelUsers(channelId), ttl);

        // Add channelId to user's active channels set
        pipeline.sAdd(RedisKeys.userActiveChannels(userId), channelId);
        pipeline.expire(RedisKeys.userActiveChannels(userId), ttl);

        // Set user's active status
        pipeline.set(RedisKeys.userActiveStatus(userId), "online");
        pipeline.expire(RedisKeys.userActiveStatus(userId), ttl);

        await pipeline.exec();
    }

    /**
     * Mark user as inactive in a channel
     * @param channelId Channel ID
     * @param userId User ID
     */
    async markUserInactiveInChannel(channelId: string, userId: string): Promise<void> {
        const pipeline = this.redis.multi();

        // Remove user from active users sorted set
        pipeline.zRem(RedisKeys.activeChannelUsers(channelId), userId);

        // Remove channelId from user's active channels set
        pipeline.sRem(RedisKeys.userActiveChannels(userId), channelId);

        // Check if user is active in any other channel
        const activeChannelsKey = RedisKeys.userActiveChannels(userId);
        const otherActiveChannels = await this.redis.sCard(activeChannelsKey);

        // If not active in any channel, remove active status
        if (otherActiveChannels <= 1) {
            pipeline.del(RedisKeys.userActiveStatus(userId));
        }

        await pipeline.exec();
    }

    /**
     * Get active users in a channel
     * @param channelId Channel ID
     * @param withTimestamps Include timestamps in results
     * @returns Array of user IDs or [userId, timestamp] pairs
     */
    async getActiveUsersInChannel(channelId: string, withTimestamps = false): Promise<string[] | [string, number][]> {
        const key = RedisKeys.activeChannelUsers(channelId);

        if (withTimestamps) {
            const result = await this.redis.zRangeWithScores(key, 0, -1);
            return result.map(item => [item.value, Number(item.score)] as [string, number]);
        }
        else {
            return this.redis.zRange(key, 0, -1);
        }
    }

    /**
     * Get number of active users in a channel
     * @param channelId Channel ID
     * @returns Number of active users
     */
    async countActiveUsersInChannel(channelId: string): Promise<number> {
        return this.redis.zCard(RedisKeys.activeChannelUsers(channelId));
    }

    /**
     * Get user's active status
     * @param userId User ID
     * @returns Active status or null if not active
     */
    async getUserActiveStatus(userId: string): Promise<string | null> {
        return this.redis.get(RedisKeys.userActiveStatus(userId));
    }

    /**
     * Get channels where user is active
     * @param userId User ID
     * @returns Array of channel IDs
     */
    async getUserActiveChannels(userId: string): Promise<string[]> {
        return this.redis.sMembers(RedisKeys.userActiveChannels(userId));
    }

    /**
     * Clean up expired activity data
     * @param channelId Channel ID
     * @param olderThan Timestamp (milliseconds)
     * @returns Number of removed entries
     */
    async cleanupExpiredActivity(channelId: string, olderThan: number): Promise<number> {
        return this.redis.zRemRangeByScore(
            RedisKeys.activeChannelUsers(channelId),
            0,
            olderThan,
        );
    }
}
