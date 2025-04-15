import type { RedisClientType } from "redis";

/**
 * Keys generator for Redis
 */
export const UserActivityKeys = {
    /**
     * Get key for user active status
     * @param userId User ID
     * @returns Redis key
     */
    userActiveStatus: (userId: string) => `user:${userId}:active_status`,

    /**
     * Get key for active users set
     * @returns Redis key
     */
    activeUsers: () => `active_users`,
};

/**
 * User Activity Service
 * Handles tracking of active users using Redis
 */
export class UserActivityService {
    /**
     * Default TTL for activity in seconds (30 minutes)
     */
    private static readonly DEFAULT_TTL = 1800;

    /**
     * Create a new UserActivityService
     * @param redis Redis client
     */
    constructor(private readonly redis: RedisClientType) {}

    /**
     * Mark user as active
     * @param userId User ID
     * @param ttl TTL in seconds (default: 30 minutes)
     */
    async markUserActive(userId: string, ttl = UserActivityService.DEFAULT_TTL): Promise<void> {
        const pipeline = this.redis.multi();
        const timestamp = Date.now();

        // Add user to active users set
        pipeline.zAdd(UserActivityKeys.activeUsers(), {
            score: timestamp,
            value: userId,
        });

        // Set TTL for the set
        pipeline.expire(UserActivityKeys.activeUsers(), ttl);

        // Set user's active status
        pipeline.set(UserActivityKeys.userActiveStatus(userId), "online");
        pipeline.expire(UserActivityKeys.userActiveStatus(userId), ttl);

        await pipeline.exec();
    }

    /**
     * Mark user as inactive
     * @param userId User ID
     */
    async markUserInactive(userId: string): Promise<void> {
        const pipeline = this.redis.multi();

        // Remove user from active users set
        pipeline.zRem(UserActivityKeys.activeUsers(), userId);

        // Remove user's active status
        pipeline.del(UserActivityKeys.userActiveStatus(userId));

        await pipeline.exec();
    }

    /**
     * Get user's active status
     * @param userId User ID
     * @returns Active status or null if not active
     */
    async getUserActiveStatus(userId: string): Promise<string | null> {
        return this.redis.get(UserActivityKeys.userActiveStatus(userId));
    }

    /**
     * Get all active users
     * @param withTimestamps Include timestamps in results
     * @returns Array of user IDs or [userId, timestamp] pairs
     */
    async getAllActiveUsers(withTimestamps = false): Promise<string[] | [string, number][]> {
        const key = UserActivityKeys.activeUsers();

        if (withTimestamps) {
            const result = await this.redis.zRangeWithScores(key, 0, -1);
            return result.map(item => [item.value, Number(item.score)] as [string, number]);
        }
        else {
            return this.redis.zRange(key, 0, -1);
        }
    }

    /**
     * Get number of active users
     * @returns Number of active users
     */
    async countActiveUsers(): Promise<number> {
        return this.redis.zCard(UserActivityKeys.activeUsers());
    }

    /**
     * Clean up expired activity data
     * @param olderThan Timestamp (milliseconds)
     * @returns Number of removed entries
     */
    async cleanupExpiredActivity(olderThan: number): Promise<number> {
        return this.redis.zRemRangeByScore(
            UserActivityKeys.activeUsers(),
            0,
            olderThan,
        );
    }
}
