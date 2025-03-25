export type Channel = {
    id: string;
    name: string;
    description?: string;
    maxParticipants: number;
    accessSettings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateChannelData = {
    name: string;
    description?: string;
    maxParticipants?: number;
    accessSettings?: Record<string, any>;
};

export type UpdateChannelData = Partial<{
    name: string;
    description: string;
    maxParticipants: number;
    accessSettings: Record<string, any>;
}>;

export type ChannelMember = {
    id: string;
    channelId: string;
    userId: string;
    role: "owner" | "moderator" | "user";
    permissions: {
        manage_members: boolean;
        manage_messages: boolean;
        manage_tasks: boolean;
        manage_calls: boolean;
        manage_polls: boolean;
    };
    joinedAt: Date;
    user?: {
        id: string;
        name: string;
        surname: string;
        username: string;
    };
};

export type CreateChannelMemberData = {
    channelId: string;
    userId: string;
    role: "owner" | "moderator" | "user";
    permissions?: {
        manage_members: boolean;
        manage_messages: boolean;
        manage_tasks: boolean;
        manage_calls: boolean;
        manage_polls: boolean;
    };
};

export type UpdateChannelMemberData = {
    role?: "owner" | "moderator" | "user";
    permissions?: Partial<{
        manage_members: boolean;
        manage_messages: boolean;
        manage_tasks: boolean;
        manage_calls: boolean;
        manage_polls: boolean;
    }>;
};

export type ChannelInvite = {
    id: string;
    channelId: string;
    createdByUserId: string;
    inviteCode: string;
    email?: string;
    expiresAt?: Date;
    isUsed: boolean;
    usedByUserId?: string;
    createdAt: Date;
};

export type CreateChannelInviteData = {
    channelId: string;
    createdByUserId: string;
    inviteCode: string;
    email?: string;
    expiresAt?: Date;
};
