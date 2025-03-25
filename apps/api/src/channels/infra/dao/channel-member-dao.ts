import type { IChannelMemberRepository } from "#channels/app/channel-member-repo.js";
import type { ChannelMember, CreateChannelMemberData, UpdateChannelMemberData } from "#channels/app/models.js";

import { and, count, eq } from "drizzle-orm";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";
import { channelMembers, users } from "#db/schema/index.js";

/**
 * Channel Member Data Access Object
 * Implements IChannelMemberRepository interface using Drizzle ORM
 */
export class ChannelMemberDao implements IChannelMemberRepository {
    /**
     * Create a new ChannelMemberDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new channel member
     * @param data Channel member data
     * @returns Created channel member
     */
    async create(data: CreateChannelMemberData): Promise<ChannelMember> {
        const result = await this.db
            .insert(channelMembers)
            .values({
                channelId: data.channelId,
                userId: data.userId,
                role: data.role,
                permissions: data.permissions || {
                    manage_members: false,
                    manage_messages: false,
                    manage_tasks: false,
                    manage_calls: false,
                    manage_polls: false,
                },
            })
            .returning();

        if (!result[0])
            throw new Error("Channel member not created");

        return this.mapToDomainMember(result[0]);
    }

    /**
     * Find all members of a channel with pagination and sorting
     * @param channelId Channel ID
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channel members
     */
    async findByChannelId(
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelMember>,
    ): Promise<PaginatedResult<ChannelMember>> {
        const countResult = await this.db
            .select({ value: count() })
            .from(channelMembers)
            .where(eq(channelMembers.channelId, channelId));

        const total = countResult[0]?.value ?? 0;

        const result = await this.db
            .select({
                member: channelMembers,
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                    username: users.username,
                },
            })
            .from(channelMembers)
            .innerJoin(users, eq(channelMembers.userId, users.id))
            .where(eq(channelMembers.channelId, channelId))
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy, "member"));

        return {
            count: total,
            data: result.map(({ member, user }) => ({
                ...this.mapToDomainMember(member),
                user: {
                    id: user.id,
                    name: user.name,
                    surname: user.surname,
                    username: user.username,
                },
            })),
        };
    }

    /**
     * Find channel member by ID
     * @param id Channel member ID
     * @returns Channel member or undefined if not found
     */
    async findById(id: string): Promise<ChannelMember | undefined> {
        const result = await this.db
            .select({
                member: channelMembers,
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                    username: users.username,
                },
            })
            .from(channelMembers)
            .innerJoin(users, eq(channelMembers.userId, users.id))
            .where(eq(channelMembers.id, id))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        const { member, user } = result[0];
        return {
            ...this.mapToDomainMember(member),
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                username: user.username,
            },
        };
    }

    /**
     * Find channel member by channel ID and user ID
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Channel member or undefined if not found
     */
    async findByChannelAndUser(channelId: string, userId: string): Promise<ChannelMember | undefined> {
        const result = await this.db
            .select({
                member: channelMembers,
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                    username: users.username,
                },
            })
            .from(channelMembers)
            .innerJoin(users, eq(channelMembers.userId, users.id))
            .where(and(
                eq(channelMembers.channelId, channelId),
                eq(channelMembers.userId, userId),
            ))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        const { member, user } = result[0];
        return {
            ...this.mapToDomainMember(member),
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                username: user.username,
            },
        };
    }

    /**
     * Update channel member
     * @param id Channel member ID
     * @param data Update data
     * @returns Updated channel member or undefined if not found
     */
    async update(id: string, data: UpdateChannelMemberData): Promise<ChannelMember | undefined> {
        const updateData: Partial<typeof channelMembers.$inferInsert> = {};

        if (data.role !== undefined) {
            updateData.role = data.role;
        }

        if (data.permissions !== undefined) {
            const currentMember = await this.findById(id);
            if (!currentMember) {
                return undefined;
            }

            // Merge with new permissions
            updateData.permissions = {
                ...currentMember.permissions,
                ...data.permissions,
            };
        }

        if (Object.keys(updateData).length === 0) {
            // Nothing to update
            return this.findById(id);
        }

        const result = await this.db
            .update(channelMembers)
            .set(updateData)
            .where(eq(channelMembers.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        const updated = await this.findById(id);
        return updated;
    }

    /**
     * Delete channel member
     * @param id Channel member ID
     * @returns Deleted channel member or undefined if not found
     */
    async delete(id: string): Promise<ChannelMember | undefined> {
        // Get the member before deleting it to return complete info
        const member = await this.findById(id);
        if (!member) {
            return undefined;
        }

        await this.db
            .delete(channelMembers)
            .where(eq(channelMembers.id, id));

        return member;
    }

    /**
     * Count members in a channel
     * @param channelId Channel ID
     * @returns Number of members
     */
    async countByChannelId(channelId: string): Promise<number> {
        const result = await this.db
            .select({ value: count() })
            .from(channelMembers)
            .where(eq(channelMembers.channelId, channelId));

        return result[0]?.value ?? 0;
    }

    /**
     * Get all channels where a user is a member
     * @param userId User ID
     * @returns Array of channel IDs
     */
    async getChannelsByUserId(userId: string): Promise<string[]> {
        const result = await this.db
            .select({ channelId: channelMembers.channelId })
            .from(channelMembers)
            .where(eq(channelMembers.userId, userId));

        return result.map(row => row.channelId);
    }

    /**
     * Map database channel member entity to domain channel member entity
     * @param member Database channel member entity
     * @returns Domain channel member entity
     */
    private mapToDomainMember(member: typeof channelMembers.$inferSelect): ChannelMember {
        const defaultPermissions = {
            manage_members: false,
            manage_messages: false,
            manage_tasks: false,
            manage_calls: false,
            manage_polls: false,
        };

        const permissions = typeof member.permissions === "object" && member.permissions !== null
            ? {
                    manage_members: !!((member.permissions as any).manage_members),
                    manage_messages: !!((member.permissions as any).manage_messages),
                    manage_tasks: !!((member.permissions as any).manage_tasks),
                    manage_calls: !!((member.permissions as any).manage_calls),
                    manage_polls: !!((member.permissions as any).manage_polls),
                }
            : defaultPermissions;

        return {
            id: member.id,
            channelId: member.channelId,
            userId: member.userId,
            role: member.role as "owner" | "moderator" | "user",
            permissions,
            joinedAt: member.joinedAt,
        };
    }
}
