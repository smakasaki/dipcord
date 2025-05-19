import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { UserActivityService } from "#users/infra/services/user-activity-service.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
} from "#commons/app/errors.js";

import type { IChannelMemberRepository } from "./channel-member-repo.js";
import type { IChannelRepository } from "./channel-repo.js";
import type {
    ChannelMember,
    CreateChannelMemberData,
    UpdateChannelMemberData,
} from "./models.js";

/**
 * Channel Membership Service
 * Handles operations related to channel members
 */
export class ChannelMembershipService {
    constructor(
        private readonly channelRepository: IChannelRepository,
        private readonly channelMemberRepository: IChannelMemberRepository,
        private readonly activeUsersService: UserActivityService,
    ) {}

    async isUserChannelMember(userId: string, channelId: string): Promise<boolean> {
        const membership = await this.channelMemberRepository.findByChannelAndUser(channelId, userId);
        return !!membership;
    }

    async addMember(
        channelId: string,
        data: { userId: string; role?: "moderator" | "user" },
        addedByUserId: string,
    ): Promise<ChannelMember> {
        // Check if channel exists
        const channel = await this.channelRepository.findById(channelId);
        if (!channel) {
            throw new NotFoundError(`Channel with ID ${channelId} not found`);
        }

        // Check if user adding the member has permission
        const addingUserMembership = await this.channelMemberRepository.findByChannelAndUser(channelId, addedByUserId);
        if (!addingUserMembership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        if (addingUserMembership.role !== "owner" && addingUserMembership.role !== "moderator"
            && !addingUserMembership.permissions.manage_members) {
            throw new PermissionDeniedError("You don't have permission to add members");
        }

        // Check if the channel is already full
        const currentMemberCount = await this.channelMemberRepository.countByChannelId(channelId);
        if (currentMemberCount >= channel.maxParticipants) {
            throw new BadRequestError(`Channel has reached its maximum capacity of ${channel.maxParticipants} members`);
        }

        // Check if user is already a member
        const existingMembership = await this.channelMemberRepository.findByChannelAndUser(channelId, data.userId);
        if (existingMembership) {
            throw new ConflictError("User is already a member of this channel");
        }

        // Only owners can add moderators
        if (data.role === "moderator" && addingUserMembership.role !== "owner") {
            throw new PermissionDeniedError("Only channel owners can add moderators");
        }

        // Cannot assign owner role to new members
        const role = data.role || "user";

        // Add the member
        const defaultPermissions = {
            manage_members: role === "moderator",
            manage_messages: role === "moderator",
            manage_tasks: role === "moderator",
            manage_calls: role === "moderator",
            manage_polls: role === "moderator",
        };

        const memberData: CreateChannelMemberData = {
            channelId,
            userId: data.userId,
            role,
            permissions: defaultPermissions,
        };

        const member = await this.channelMemberRepository.create(memberData);

        return member;
    }

    async getChannelMembers(
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelMember>,
    ): Promise<PaginatedResult<ChannelMember>> {
        // Check if channel exists
        const channel = await this.channelRepository.findById(channelId);
        if (!channel) {
            throw new NotFoundError(`Channel with ID ${channelId} not found`);
        }

        return this.channelMemberRepository.findByChannelId(channelId, pagination, sortBy);
    }

    async getMemberById(memberId: string): Promise<ChannelMember> {
        const member = await this.channelMemberRepository.findById(memberId);
        if (!member) {
            throw new NotFoundError(`Channel member with ID ${memberId} not found`);
        }
        return member;
    }

    async updateMember(
        memberId: string,
        data: UpdateChannelMemberData,
        updatedByUserId: string,
    ): Promise<ChannelMember> {
        // Get the member to update
        const member = await this.getMemberById(memberId);

        // Check if user updating the member has permission
        const updatingUserMembership = await this.channelMemberRepository.findByChannelAndUser(
            member.channelId,
            updatedByUserId,
        );

        if (!updatingUserMembership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        // Only owners can change roles
        if (data.role !== undefined && updatingUserMembership.role !== "owner") {
            throw new PermissionDeniedError("Only channel owners can change roles");
        }

        // Owner role cannot be changed except by the owner
        if (member.role === "owner" && updatedByUserId !== member.userId) {
            throw new PermissionDeniedError("Only the channel owner can transfer ownership");
        }

        // Only owners and moderators can change permissions
        if (data.permissions !== undefined
            && updatingUserMembership.role !== "owner"
            && updatingUserMembership.role !== "moderator") {
            throw new PermissionDeniedError("You don't have permission to change member permissions");
        }

        // If changing role to moderator, update permissions to match
        if (data.role === "moderator") {
            data.permissions = {
                manage_members: true,
                manage_messages: true,
                manage_tasks: true,
                manage_calls: true,
                manage_polls: true,
            };
        }
        else if (data.role === "user") {
        // If changing role to regular user, update permissions to match
            data.permissions = {
                manage_members: false,
                manage_messages: false,
                manage_tasks: false,
                manage_calls: false,
                manage_polls: false,
            };
        }

        // Update the member
        const updatedMember = await this.channelMemberRepository.update(memberId, data);
        if (!updatedMember) {
            throw new Error("Failed to update channel member");
        }

        return updatedMember;
    }

    async removeMember(
        memberId: string,
        removedByUserId: string,
    ): Promise<ChannelMember> {
        // Get the member to remove
        const member = await this.getMemberById(memberId);

        // Owner cannot be removed
        if (member.role === "owner") {
            throw new PermissionDeniedError("Channel owner cannot be removed");
        }

        // Check if user removing the member has permission
        const removingUserMembership = await this.channelMemberRepository.findByChannelAndUser(
            member.channelId,
            removedByUserId,
        );

        if (!removingUserMembership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        // Users can remove themselves
        if (member.userId === removedByUserId) {
            // Removing self is always allowed
        }
        // Only owners and moderators can remove other members
        else if (removingUserMembership.role !== "owner"
            && removingUserMembership.role !== "moderator"
            && !removingUserMembership.permissions.manage_members) {
            throw new PermissionDeniedError("You don't have permission to remove members");
        }

        // Delete the member
        const removedMember = await this.channelMemberRepository.delete(memberId);
        if (!removedMember) {
            throw new Error("Failed to remove channel member");
        }

        return removedMember;
    }

    async getActiveUsers(channelId: string): Promise<string[]> {
        // Check if channel exists
        const channel = await this.channelRepository.findById(channelId);
        if (!channel) {
            throw new NotFoundError(`Channel with ID ${channelId} not found`);
        }

        // Get all members in the channel
        const members = await this.channelMemberRepository.findByChannelId(
            channelId,
            { offset: 0, limit: 1000 }, // Using a large limit to get all members
            [["id", "asc"]],
        );

        const memberUserIds = members.data.map(member => member.userId);

        // Get all active users
        const activeUsers = await this.activeUsersService.getAllActiveUsers() as string[];

        // Return the intersection - channel members who are active
        return memberUserIds.filter(userId => activeUsers.includes(userId));
    }
}
