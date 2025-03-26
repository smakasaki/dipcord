import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import type { ChannelInvite, CreateChannelInviteData } from "./models.js";

/**
 * Channel Invite Repository Interface
 * Defines operations for channel invite management
 */
export type IChannelInviteRepository = {
    /**
     * Create a new channel invite
     * @param data Channel invite data
     * @returns Created channel invite
     */
    create: (data: CreateChannelInviteData) => Promise<ChannelInvite>;

    /**
     * Find all invites for a channel with pagination and sorting
     * @param channelId Channel ID
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channel invites
     */
    findByChannelId: (
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelInvite>
    ) => Promise<PaginatedResult<ChannelInvite>>;

    /**
     * Find channel invite by ID
     * @param id Channel invite ID
     * @returns Channel invite or undefined if not found
     */
    findById: (id: string) => Promise<ChannelInvite | undefined>;

    /**
     * Find channel invite by invite code
     * @param inviteCode Invite code
     * @returns Channel invite or undefined if not found
     */
    findByInviteCode: (inviteCode: string) => Promise<ChannelInvite | undefined>;

    /**
     * Find valid invite by email
     * @param email Email address
     * @returns Channel invite or undefined if not found
     */
    findValidByEmail: (email: string) => Promise<ChannelInvite | undefined>;

    /**
     * Mark invite as used
     * @param id Invite ID
     * @param userId User ID who used the invite
     * @returns Updated invite or undefined if not found
     */
    markAsUsed: (id: string, userId: string) => Promise<ChannelInvite | undefined>;

    /**
     * Delete channel invite
     * @param id Channel invite ID
     * @returns Deleted channel invite or undefined if not found
     */
    delete: (id: string) => Promise<ChannelInvite | undefined>;
};
