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
    if (!member) {
        return null;
    }

    return {
        id: member.id,
        channelId: member.channelId,
        userId: member.userId,
        role: member.role,
        permissions: {
            manage_members: member.permissions?.manage_members || false,
            manage_messages: member.permissions?.manage_messages || false,
            manage_tasks: member.permissions?.manage_tasks || false,
            manage_calls: member.permissions?.manage_calls || false,
            manage_polls: member.permissions?.manage_polls || false,
        },
        joinedAt: member.joinedAt ? member.joinedAt.toISOString() : new Date().toISOString(),
        user: member.user
            ? {
                    id: member.user.id,
                    name: member.user.name || "",
                    surname: member.user.surname || "",
                    username: member.user.username || "",
                }
            : undefined,
    };
}

/**
 * Maps domain ChannelInvite to API response format
 * @param invite Domain channel invite model
 * @returns API channel invite response format
 */
export function mapChannelInviteToResponse(invite: ChannelInvite): any {
    if (!invite) {
        return null;
    }

    return {
        id: invite.id,
        channelId: invite.channelId,
        createdByUserId: invite.createdByUserId,
        inviteCode: invite.inviteCode,
        email: invite.email,
        expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
        isUsed: invite.isUsed || false,
        usedByUserId: invite.usedByUserId || null,
        createdAt: invite.createdAt ? invite.createdAt.toISOString() : new Date().toISOString(),
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
