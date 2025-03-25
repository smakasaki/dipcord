import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import type { ChannelMember, CreateChannelMemberData, UpdateChannelMemberData } from "./models.js";

/**
 * Channel Member Repository Interface
 * Defines operations for channel member management
 */
export type IChannelMemberRepository = {
    /**
     * Create a new channel member
     * @param data Channel member data
     * @returns Created channel member
     */
    create: (data: CreateChannelMemberData) => Promise<ChannelMember>;

    /**
     * Find all members of a channel with pagination and sorting
     * @param channelId Channel ID
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channel members
     */
    findByChannelId: (
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelMember>
    ) => Promise<PaginatedResult<ChannelMember>>;

    /**
     * Find channel member by ID
     * @param id Channel member ID
     * @returns Channel member or undefined if not found
     */
    findById: (id: string) => Promise<ChannelMember | undefined>;

    /**
     * Find channel member by channel ID and user ID
     * @param channelId Channel ID
     * @param userId User ID
     * @returns Channel member or undefined if not found
     */
    findByChannelAndUser: (channelId: string, userId: string) => Promise<ChannelMember | undefined>;

    /**
     * Update channel member
     * @param id Channel member ID
     * @param data Update data
     * @returns Updated channel member or undefined if not found
     */
    update: (id: string, data: UpdateChannelMemberData) => Promise<ChannelMember | undefined>;

    /**
     * Delete channel member
     * @param id Channel member ID
     * @returns Deleted channel member or undefined if not found
     */
    delete: (id: string) => Promise<ChannelMember | undefined>;

    /**
     * Count members in a channel
     * @param channelId Channel ID
     * @returns Number of members
     */
    countByChannelId: (channelId: string) => Promise<number>;

    /**
     * Get all channels where a user is a member
     * @param userId User ID
     * @returns Array of channel IDs
     */
    getChannelsByUserId: (userId: string) => Promise<string[]>;
};
