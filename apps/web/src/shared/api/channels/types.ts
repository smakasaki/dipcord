export type GetUserChannelsParams = {
    offset?: number;
    limit?: number;
    sort?: string[];
};

export type GetChannelMembersParams = {
    offset?: number;
    limit?: number;
    sort?: string[];
};

export type ChannelMember = {
    id: string;
    userId: string;
    role: string;
    permissions: {
        manage_members: boolean;
        manage_messages: boolean;
        manage_tasks: boolean;
        manage_calls: boolean;
        manage_polls: boolean;
    };
    channelId: string;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        surname: string;
        username: string;
        avatar?: string;
    };
};
