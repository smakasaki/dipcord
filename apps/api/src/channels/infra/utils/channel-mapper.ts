import type { Channel, ChannelInvite, ChannelMember } from "#channels/app/models.js";
import type { PaginatedResult } from "#commons/app/models.js";

/**
 * Maps domain Channel to API response format
 * @param channel Domain channel model
 * @returns API channel response format
 */
export function mapChannelToResponse(channel: Channel): any {
    return {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        maxParticipants: channel.maxParticipants,
        accessSettings: channel.accessSettings,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
    };
}

/**
 * Maps domain ChannelMember to API response format
 * @param member Domain channel member model
 * @returns API channel member response format
 */
export function mapChannelMemberToResponse(member: ChannelMember): any {
    return {
        id: member.id,
        channelId: member.channelId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt.toISOString(),
        user: member.user,
    };
}

/**
 * Maps domain ChannelInvite to API response format
 * @param invite Domain channel invite model
 * @returns API channel invite response format
 */
export function mapChannelInviteToResponse(invite: ChannelInvite): any {
    return {
        id: invite.id,
        channelId: invite.channelId,
        createdByUserId: invite.createdByUserId,
        inviteCode: invite.inviteCode,
        email: invite.email,
        expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
        isUsed: invite.isUsed,
        usedByUserId: invite.usedByUserId,
        createdAt: invite.createdAt.toISOString(),
    };
}

/**
 * Maps paginated domain Channels to API response format
 * @param result Paginated domain channel models
 * @returns API paginated channels response format
 */
export function mapPaginatedChannelsToResponse(result: PaginatedResult<Channel>): any {
    return {
        count: result.count,
        data: result.data.map(mapChannelToResponse),
    };
}

/**
 * Maps paginated domain ChannelMembers to API response format
 * @param result Paginated domain channel member models
 * @returns API paginated channel members response format
 */
export function mapPaginatedMembersToResponse(result: PaginatedResult<ChannelMember>): any {
    return {
        count: result.count,
        data: result.data.map(mapChannelMemberToResponse),
    };
}

/**
 * Maps paginated domain ChannelInvites to API response format
 * @param result Paginated domain channel invite models
 * @returns API paginated channel invites response format
 */
export function mapPaginatedInvitesToResponse(result: PaginatedResult<ChannelInvite>): any {
    return {
        count: result.count,
        data: result.data.map(mapChannelInviteToResponse),
    };
}
