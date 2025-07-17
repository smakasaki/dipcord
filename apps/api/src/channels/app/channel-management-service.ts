import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import { NotFoundError, PermissionDeniedError } from "#commons/app/errors.js";

import type { IChannelInviteRepository } from "./channel-invite-repo.js";
import type { IChannelMemberRepository } from "./channel-member-repo.js";
import type { IChannelRepository } from "./channel-repo.js";
import type {
    Channel,
    ChannelMember,
    CreateChannelData,
    CreateChannelMemberData,
    UpdateChannelData,
} from "./models.js";

/**
 * Channel Management Service
 * Handles core channel operations like creating, retrieving, updating, and deleting channels
 */
export class ChannelManagementService {
    constructor(
        private readonly channelRepository: IChannelRepository,
        private readonly channelMemberRepository: IChannelMemberRepository,
        private readonly channelInviteRepository: IChannelInviteRepository,
    ) {}

    async createChannel(data: CreateChannelData, creatorId: string): Promise<{
        channel: Channel;
        owner: ChannelMember;
    }> {
        // Create the channel
        const channel = await this.channelRepository.create({
            ...data,
            maxParticipants: data.maxParticipants || 50,
        });

        // Add creator as owner
        const ownerData: CreateChannelMemberData = {
            channelId: channel.id,
            userId: creatorId,
            role: "owner",
            permissions: {
                manage_members: true,
                manage_messages: true,
                manage_tasks: true,
                manage_calls: true,
                manage_polls: true,
            },
        };

        const owner = await this.channelMemberRepository.create(ownerData);

        return { channel, owner };
    }

    async getChannelById(id: string): Promise<Channel> {
        const channel = await this.channelRepository.findById(id);
        if (!channel) {
            throw new NotFoundError(`Channel with ID ${id} not found`);
        }
        return channel;
    }

    async getUserChannels(
        userId: string,
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        const channelIds = await this.channelMemberRepository.getChannelsByUserId(userId);

        if (channelIds.length === 0) {
            return {
                count: 0,
                data: [],
            };
        }

        return this.channelRepository.findByIds(
            channelIds,
            pagination,
            sortBy,
        );
    }

    async getAllChannels(
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        return this.channelRepository.findAll(pagination, sortBy);
    }

    async updateChannel(
        id: string,
        data: UpdateChannelData,
        userId: string,
    ): Promise<Channel> {
        // Check if channel exists
        await this.getChannelById(id);

        // Check if user has permission to update the channel
        const membership = await this.channelMemberRepository.findByChannelAndUser(id, userId);
        if (!membership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        if (membership.role !== "owner" && membership.role !== "moderator") {
            throw new PermissionDeniedError("You don't have permission to update the channel");
        }

        // Update the channel
        const updatedChannel = await this.channelRepository.update(id, data);
        if (!updatedChannel) {
            throw new Error("Failed to update channel");
        }

        return updatedChannel;
    }

    async deleteChannel(id: string, userId: string): Promise<Channel> {
        await this.getChannelById(id);

        const membership = await this.channelMemberRepository.findByChannelAndUser(id, userId);
        if (!membership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        if (membership.role !== "owner") {
            throw new PermissionDeniedError("Only the channel owner can delete the channel");
        }

        const allMembers = await this.channelMemberRepository.findByChannelId(
            id,
            { offset: 0, limit: 1000 },
            [["id", "asc"]],
        );

        for (const member of allMembers.data) {
            await this.channelMemberRepository.delete(member.id);
        }

        const allInvites = await this.channelInviteRepository.findByChannelId(
            id,
            { offset: 0, limit: 1000 },
            [["id", "asc"]],
        );

        for (const invite of allInvites.data) {
            await this.channelInviteRepository.delete(invite.id);
        }

        const deletedChannel = await this.channelRepository.delete(id);
        if (!deletedChannel) {
            throw new Error("Failed to delete channel");
        }

        return deletedChannel;
    }
}
