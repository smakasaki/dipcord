import type { 
    Channel, 
    ChannelInvite, 
    ChannelRole, 
    ChannelPermissions 
} from "../entities/channel.js";

export type CreateChannelData = Pick<Channel, 'name' | 'description'> & {
    maxParticipants?: number;
    accessSettings?: Record<string, any>;
};

export type UpdateChannelData = Partial<Pick<Channel, 'name' | 'description' | 'maxParticipants' | 'accessSettings'>>;

export type CreateChannelMemberData = {
    channelId: string;
    userId: string;
    role: ChannelRole;
    permissions?: ChannelPermissions;
};

export type UpdateChannelMemberData = {
    role?: ChannelRole;
    permissions?: Partial<ChannelPermissions>;
};

export type CreateChannelInviteData = Pick<ChannelInvite, 'channelId' | 'createdByUserId' | 'inviteCode' | 'email' | 'expiresAt'>;