export type Channel = {
    id: string;
    name: string;
    description?: string;
    maxParticipants: number;
    accessSettings?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
};

export type ChannelResponse = {
    id: string;
    name: string;
    description?: string;
    maxParticipants: number;
    accessSettings?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};

export type ChannelsListResponse = {
    count: number;
    data: ChannelResponse[];
};
