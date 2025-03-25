import type { IChannelInviteRepository } from "#channels/app/channel-invite-repo.js";
import type { ChannelInvite, CreateChannelInviteData } from "#channels/app/models.js";

import { and, count, eq, gt, isNull } from "drizzle-orm";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";
import { channelInvites } from "#db/schema/index.js";

/**
 * Channel Invite Data Access Object
 * Implements IChannelInviteRepository interface using Drizzle ORM
 */
export class ChannelInviteDao implements IChannelInviteRepository {
    /**
     * Create a new ChannelInviteDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new channel invite
     * @param data Channel invite data
     * @returns Created channel invite
     */
    async create(data: CreateChannelInviteData): Promise<ChannelInvite> {
        const result = await this.db
            .insert(channelInvites)
            .values({
                channelId: data.channelId,
                createdByUserId: data.createdByUserId,
                inviteCode: data.inviteCode,
                email: data.email,
                expiresAt: data.expiresAt,
            })
            .returning();

        if (!result[0])
            throw new Error("Channel invite not created");

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Find all invites for a channel with pagination and sorting
     * @param channelId Channel ID
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channel invites
     */
    async findByChannelId(
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelInvite>,
    ): Promise<PaginatedResult<ChannelInvite>> {
        const countResult = await this.db
            .select({ value: count() })
            .from(channelInvites)
            .where(eq(channelInvites.channelId, channelId));

        const total = countResult[0]?.value ?? 0;

        const result = await this.db
            .select()
            .from(channelInvites)
            .where(eq(channelInvites.channelId, channelId))
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        return {
            count: total,
            data: result.map(invite => this.mapToDomainInvite(invite)),
        };
    }

    /**
     * Find channel invite by ID
     * @param id Channel invite ID
     * @returns Channel invite or undefined if not found
     */
    async findById(id: string): Promise<ChannelInvite | undefined> {
        const result = await this.db
            .select()
            .from(channelInvites)
            .where(eq(channelInvites.id, id))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Find channel invite by invite code
     * @param inviteCode Invite code
     * @returns Channel invite or undefined if not found
     */
    async findByInviteCode(inviteCode: string): Promise<ChannelInvite | undefined> {
        const result = await this.db
            .select()
            .from(channelInvites)
            .where(eq(channelInvites.inviteCode, inviteCode))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Find valid invite by email
     * @param email Email address
     * @returns Channel invite or undefined if not found
     */
    async findValidByEmail(email: string): Promise<ChannelInvite | undefined> {
        const now = new Date();

        const result = await this.db
            .select()
            .from(channelInvites)
            .where(and(
                eq(channelInvites.email, email),
                eq(channelInvites.isUsed, false),
                // Either no expiration or expiration in the future
                and(
                    isNull(channelInvites.expiresAt),
                    gt(channelInvites.expiresAt, now),
                ),
            ))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Mark invite as used
     * @param id Invite ID
     * @param userId User ID who used the invite
     * @returns Updated invite or undefined if not found
     */
    async markAsUsed(id: string, userId: string): Promise<ChannelInvite | undefined> {
        const result = await this.db
            .update(channelInvites)
            .set({
                isUsed: true,
                usedByUserId: userId,
            })
            .where(eq(channelInvites.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Delete channel invite
     * @param id Channel invite ID
     * @returns Deleted channel invite or undefined if not found
     */
    async delete(id: string): Promise<ChannelInvite | undefined> {
        const result = await this.db
            .delete(channelInvites)
            .where(eq(channelInvites.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainInvite(result[0]);
    }

    /**
     * Map database channel invite entity to domain channel invite entity
     * @param invite Database channel invite entity
     * @returns Domain channel invite entity
     */
    private mapToDomainInvite(invite: typeof channelInvites.$inferSelect): ChannelInvite {
        return {
            id: invite.id,
            channelId: invite.channelId,
            createdByUserId: invite.createdByUserId,
            inviteCode: invite.inviteCode,
            email: invite.email || undefined,
            expiresAt: invite.expiresAt || undefined,
            isUsed: invite.isUsed,
            usedByUserId: invite.usedByUserId || undefined,
            createdAt: invite.createdAt,
        };
    }
}
