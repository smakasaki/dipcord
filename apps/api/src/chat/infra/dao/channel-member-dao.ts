import { and, eq } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";

import { channelMembers } from "#db/schema/index.js";

import type { ChannelMemberRepository } from "../../app/ports/outgoing.js";

/**
 * Channel Member Data Access Object for Chat Module
 * Implements ChannelMemberRepository interface using Drizzle ORM
 */
export class ChannelMemberDao implements ChannelMemberRepository {
    /**
     * Create a new ChannelMemberDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Check if a user is a member of a channel
     * @param userId User ID
     * @param channelId Channel ID
     * @returns True if the user is a member of the channel
     */
    async isUserChannelMember(userId: string, channelId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: channelMembers.id })
            .from(channelMembers)
            .where(
                and(
                    eq(channelMembers.userId, userId),
                    eq(channelMembers.channelId, channelId),
                ),
            )
            .limit(1);

        return result.length > 0;
    }

    /**
     * Get user permissions in a channel
     * @param userId User ID
     * @param channelId Channel ID
     * @returns User role and permissions or null if not a member
     */
    async getUserPermissionsInChannel(userId: string, channelId: string): Promise<{
        role: "owner" | "moderator" | "user";
        permissions: {
            manage_messages: boolean;
            [key: string]: boolean;
        } | null;
    } | null> {
        const result = await this.db
            .select({
                role: channelMembers.role,
                permissions: channelMembers.permissions,
            })
            .from(channelMembers)
            .where(
                and(
                    eq(channelMembers.userId, userId),
                    eq(channelMembers.channelId, channelId),
                ),
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const member = result[0];
        return {
            role: member?.role as "owner" | "moderator" | "user",
            permissions: member?.permissions as {
                manage_messages: boolean;
                [key: string]: boolean;
            } | null,
        };
    }
}
