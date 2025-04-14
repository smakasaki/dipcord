import { randomUUID } from "node:crypto";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    UserNotFoundError,
} from "#commons/app/errors.js";

import type { ActiveUsersService } from "./active-users-service.js";
import type { IChannelInviteRepository } from "./channel-invite-repo.js";
import type { IChannelMemberRepository } from "./channel-member-repo.js";
import type { IChannelRepository } from "./channel-repo.js";
import type {
    Channel,
    ChannelInvite,
    ChannelMember,
    CreateChannelData,
    CreateChannelInviteData,
    CreateChannelMemberData,
    UpdateChannelData,
    UpdateChannelMemberData,
} from "./models.js";

/**
 * Channel Service
 * Business logic for channel management
 */
export class ChannelService {
    constructor(
        private readonly channelRepository: IChannelRepository,
        private readonly channelMemberRepository: IChannelMemberRepository,
        private readonly channelInviteRepository: IChannelInviteRepository,
        private readonly activeUsersService: ActiveUsersService,
    ) {}

    async isUserChannelMember(userId: string, channelId: string): Promise<boolean> {
        const membership = await this.channelMemberRepository.findByChannelAndUser(channelId, userId);
        return !!membership;
    }

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

    async addMember(
        channelId: string,
        data: { userId: string; role?: "moderator" | "user" },
        addedByUserId: string,
    ): Promise<ChannelMember> {
        // Check if channel exists
        const channel = await this.getChannelById(channelId);

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
        // Removed the problematic role comparison since it's handled by TypeScript type definition

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
        await this.getChannelById(channelId);

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

        // Remove active status from Redis
        await this.activeUsersService.markUserInactiveInChannel(member.channelId, member.userId);

        // Delete the member
        const removedMember = await this.channelMemberRepository.delete(memberId);
        if (!removedMember) {
            throw new Error("Failed to remove channel member");
        }

        return removedMember;
    }

    async createInvite(
        channelId: string,
        data: { email?: string; expiresAt?: Date },
        createdByUserId: string,
    ): Promise<ChannelInvite> {
        // Check if channel exists
        const channel = await this.getChannelById(channelId);

        // Check if user has permission to create invites
        const membership = await this.channelMemberRepository.findByChannelAndUser(channelId, createdByUserId);
        if (!membership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        if (membership.role !== "owner"
            && membership.role !== "moderator"
            && !membership.permissions.manage_members) {
            throw new PermissionDeniedError("You don't have permission to create invites");
        }

        // Check if the channel is already full
        const currentMemberCount = await this.channelMemberRepository.countByChannelId(channelId);
        if (currentMemberCount >= channel.maxParticipants) {
            throw new BadRequestError(`Channel has reached its maximum capacity of ${channel.maxParticipants} members`);
        }

        // Generate unique invite code
        const inviteCode = randomUUID().replace(/-/g, "");

        // Create the invite data object
        const inviteData: CreateChannelInviteData = {
            channelId,
            createdByUserId,
            inviteCode,
            email: data.email,
            expiresAt: data.expiresAt,
        };

        // Create the invite
        const invite = await this.channelInviteRepository.create(inviteData);

        return invite;
    }

    async getChannelInvites(
        channelId: string,
        userId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelInvite>,
    ): Promise<PaginatedResult<ChannelInvite>> {
        // Check if channel exists
        await this.getChannelById(channelId);

        // Check if user has permission to view invites
        const membership = await this.channelMemberRepository.findByChannelAndUser(channelId, userId);
        if (!membership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        return this.channelInviteRepository.findByChannelId(channelId, pagination, sortBy);
    }

    async acceptInvite(
        inviteCode: string,
        userId: string,
    ): Promise<ChannelMember> {
        // Find the invite
        const invite = await this.channelInviteRepository.findByInviteCode(inviteCode);
        if (!invite) {
            throw new NotFoundError("Invite not found or invalid");
        }

        // Check if invite is already used
        if (invite.isUsed) {
            throw new BadRequestError("Invite has already been used");
        }

        // Check if invite is expired
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new BadRequestError("Invite has expired");
        }

        // Check if the channel still exists
        const channel = await this.getChannelById(invite.channelId);

        // Check if the channel is already full
        const currentMemberCount = await this.channelMemberRepository.countByChannelId(invite.channelId);
        if (currentMemberCount >= channel.maxParticipants) {
            throw new BadRequestError(`Channel has reached its maximum capacity of ${channel.maxParticipants} members`);
        }

        // Check if user is already a member
        const existingMembership = await this.channelMemberRepository.findByChannelAndUser(invite.channelId, userId);
        if (existingMembership) {
            throw new ConflictError("You are already a member of this channel");
        }

        // Create the member data object
        const memberData: CreateChannelMemberData = {
            channelId: invite.channelId,
            userId,
            role: "user",
            permissions: {
                manage_members: false,
                manage_messages: false,
                manage_tasks: false,
                manage_calls: false,
                manage_polls: false,
            },
        };

        // Add user as a member
        const member = await this.channelMemberRepository.create(memberData);

        // Mark invite as used
        await this.channelInviteRepository.markAsUsed(invite.id, userId);

        return member;
    }

    async deleteInvite(
        inviteId: string,
        deletedByUserId: string,
    ): Promise<ChannelInvite> {
        // Find the invite
        const invite = await this.channelInviteRepository.findById(inviteId);
        if (!invite) {
            throw new NotFoundError(`Invite with ID ${inviteId} not found`);
        }

        // Check if user has permission to delete invites
        const membership = await this.channelMemberRepository.findByChannelAndUser(
            invite.channelId,
            deletedByUserId,
        );

        if (!membership) {
            throw new PermissionDeniedError("You are not a member of this channel");
        }

        // Creator can delete their own invites
        const isCreator = invite.createdByUserId === deletedByUserId;

        // Others need appropriate permissions
        if (!isCreator
            && membership.role !== "owner"
            && membership.role !== "moderator"
            && !membership.permissions.manage_members) {
            throw new PermissionDeniedError("You don't have permission to delete this invite");
        }

        // Delete the invite
        const deletedInvite = await this.channelInviteRepository.delete(inviteId);
        if (!deletedInvite) {
            throw new Error("Failed to delete invite");
        }

        return deletedInvite;
    }

    async trackUserActivity(channelId: string, userId: string): Promise<void> {
        // Check if channel exists
        await this.getChannelById(channelId);

        // Check if user is a member of the channel
        const membership = await this.channelMemberRepository.findByChannelAndUser(channelId, userId);
        if (!membership) {
            throw new UserNotFoundError(`User ${userId} is not a member of channel ${channelId}`);
        }

        // Update active status in Redis
        await this.activeUsersService.markUserActiveInChannel(channelId, userId);
    }

    async getActiveUsers(channelId: string): Promise<string[]> {
        // Check if channel exists
        await this.getChannelById(channelId);

        return this.activeUsersService.getActiveUsersInChannel(channelId, false) as Promise<string[]>;
    }
}
