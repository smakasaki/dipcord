import { count, eq, inArray } from "drizzle-orm";

import type { IChannelRepository } from "#channels/app/channel-repo.js";
import type { Channel, CreateChannelData, UpdateChannelData } from "#channels/app/models.js";
import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";
import { channels } from "#db/schema/index.js";

/**
 * Channel Data Access Object
 * Implements IChannelRepository interface using Drizzle ORM
 */
export class ChannelDao implements IChannelRepository {
    /**
     * Create a new ChannelDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new channel
     * @param data Channel data
     * @returns Created channel
     */
    async create(data: CreateChannelData): Promise<Channel> {
        const result = await this.db
            .insert(channels)
            .values({
                name: data.name,
                description: data.description,
                maxParticipants: data.maxParticipants,
                accessSettings: data.accessSettings || {},
            })
            .returning();

        if (!result[0])
            throw new Error("Channel not created");

        return this.mapToDomainChannel(result[0]);
    }

    /**
     * Find all channels with pagination and sorting
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channels
     */
    async findAll(
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        const countResult = await this.db
            .select({ value: count() })
            .from(channels);

        const total = countResult[0]?.value ?? 0;

        const result = await this.db
            .select()
            .from(channels)
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        return {
            count: total,
            data: result.map(channel => this.mapToDomainChannel(channel)),
        };
    }

    /**
     * Find channel by id
     * @param id Channel id
     * @returns Channel or undefined if not found
     */
    async findById(id: string): Promise<Channel | undefined> {
        const result = await this.db
            .select()
            .from(channels)
            .where(eq(channels.id, id))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainChannel(result[0]);
    }

    /**
     * Find channels by IDs with pagination and sorting
     * @param ids Array of channel IDs
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channels
     */
    async findByIds(
        ids: string[],
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        if (ids.length === 0) {
            return {
                count: 0,
                data: [],
            };
        }

        // Count total matching channels
        const countResult = await this.db
            .select({ value: count() })
            .from(channels)
            .where(inArray(channels.id, ids));

        const total = countResult[0]?.value ?? 0;

        // Get paginated and sorted channels
        const result = await this.db
            .select()
            .from(channels)
            .where(inArray(channels.id, ids))
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        return {
            count: total,
            data: result.map(channel => this.mapToDomainChannel(channel)),
        };
    }

    /**
     * Update channel
     * @param id Channel id
     * @param data Channel data to update
     * @returns Updated channel or undefined if not found
     */
    async update(id: string, data: UpdateChannelData): Promise<Channel | undefined> {
        const updateData: Partial<typeof channels.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (data.name !== undefined) {
            updateData.name = data.name;
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.maxParticipants !== undefined) {
            updateData.maxParticipants = data.maxParticipants;
        }

        if (data.accessSettings !== undefined) {
            updateData.accessSettings = data.accessSettings;
        }

        const result = await this.db
            .update(channels)
            .set(updateData)
            .where(eq(channels.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainChannel(result[0]);
    }

    /**
     * Delete channel
     * @param id Channel id
     * @returns Deleted channel or undefined if not found
     */
    async delete(id: string): Promise<Channel | undefined> {
        const result = await this.db
            .delete(channels)
            .where(eq(channels.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainChannel(result[0]);
    }

    /**
     * Map database channel entity to domain channel entity
     * @param channel Database channel entity
     * @returns Domain channel entity
     */
    private mapToDomainChannel(channel: typeof channels.$inferSelect): Channel {
        return {
            id: channel.id,
            name: channel.name,
            description: channel.description || undefined,
            maxParticipants: channel.maxParticipants,
            accessSettings: channel.accessSettings ?? {},
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
        };
    }
}
