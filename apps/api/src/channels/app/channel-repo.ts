import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import type { Channel, CreateChannelData, UpdateChannelData } from "./models.js";

/**
 * Channel Repository Interface
 * Defines operations for channel management
 */
export type IChannelRepository = {
    /**
     * Create a new channel
     * @param data Channel data
     * @returns Created channel
     */
    create: (data: CreateChannelData) => Promise<Channel>;

    /**
     * Find all channels with pagination and sorting
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated channels
     */
    findAll: (
        pagination: Pagination,
        sortBy: SortBy<Channel>
    ) => Promise<PaginatedResult<Channel>>;

    /**
     * Find channel by id
     * @param id Channel id
     * @returns Channel or undefined if not found
     */
    findById: (id: string) => Promise<Channel | undefined>;

    /**
     * Update channel
     * @param id Channel id
     * @param data Channel data to update
     * @returns Updated channel or undefined if not found
     */
    update: (id: string, data: UpdateChannelData) => Promise<Channel | undefined>;

    /**
     * Delete channel
     * @param id Channel id
     * @returns Deleted channel or undefined if not found
     */
    delete: (id: string) => Promise<Channel | undefined>;
};
