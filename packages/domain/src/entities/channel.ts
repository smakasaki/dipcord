export type ChannelRole = "owner" | "moderator" | "user";

export type ChannelPermissions = {
    manage_members: boolean;
    manage_messages: boolean;
    manage_tasks: boolean;
    manage_calls: boolean;
    manage_polls: boolean;
};

export type Channel = {
    id: string;
    name: string;
    description?: string;
    maxParticipants: number;
    accessSettings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
};

export type ChannelMember = {
    id: string;
    channelId: string;
    userId: string;
    role: ChannelRole;
    permissions: ChannelPermissions;
    joinedAt: Date;
    user?: {
        id: string;
        name: string;
        surname: string;
        username: string;
    };
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