export type MessageSort = 'newest' | 'oldest';

export interface MessageFilters {
    channelId: string;
    parentMessageId?: string | null;
    includeDeleted?: boolean;
}

export interface MessagePaginationParams {
    limit: number;
    cursor?: string;
    sort?: MessageSort;
    filters: MessageFilters;
} 