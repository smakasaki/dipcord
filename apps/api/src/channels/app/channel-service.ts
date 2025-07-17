import { randomUUID } from "node:crypto";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { UserActivityService } from "#users/infra/services/user-activity-service.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    UserNotFoundError,
} from "#commons/app/errors.js";

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

import { ChannelInviteService } from "./channel-invite-service.js";
import { ChannelManagementService } from "./channel-management-service.js";
import { ChannelMembershipService } from "./channel-membership-service.js";

/**
 * Channel Service
 * Facade that delegates to domain-specific services
 */
export class ChannelService {
    private channelManagementService: ChannelManagementService;
    private channelMembershipService: ChannelMembershipService;
    private channelInviteService: ChannelInviteService;

    constructor(
        channelRepository: IChannelRepository,
        channelMemberRepository: IChannelMemberRepository,
        channelInviteRepository: IChannelInviteRepository,
        activeUsersService: UserActivityService,
    ) {
        this.channelManagementService = new ChannelManagementService(
            channelRepository,
            channelMemberRepository,
            channelInviteRepository,
        );

        this.channelMembershipService = new ChannelMembershipService(
            channelRepository,
            channelMemberRepository,
            activeUsersService,
        );

        this.channelInviteService = new ChannelInviteService(
            channelRepository,
            channelMemberRepository,
            channelInviteRepository,
        );
    }

    // Channel Management Operations

    async createChannel(data: CreateChannelData, creatorId: string): Promise<{
        channel: Channel;
        owner: ChannelMember;
    }> {
        return this.channelManagementService.createChannel(data, creatorId);
    }

    async getChannelById(id: string): Promise<Channel> {
        return this.channelManagementService.getChannelById(id);
    }

    async getUserChannels(
        userId: string,
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        return this.channelManagementService.getUserChannels(userId, pagination, sortBy);
    }

    async getAllChannels(
        pagination: Pagination,
        sortBy: SortBy<Channel>,
    ): Promise<PaginatedResult<Channel>> {
        return this.channelManagementService.getAllChannels(pagination, sortBy);
    }

    async updateChannel(
        id: string,
        data: UpdateChannelData,
        userId: string,
    ): Promise<Channel> {
        return this.channelManagementService.updateChannel(id, data, userId);
    }

    async deleteChannel(id: string, userId: string): Promise<Channel> {
        return this.channelManagementService.deleteChannel(id, userId);
    }

    // Channel Membership Operations

    async isUserChannelMember(userId: string, channelId: string): Promise<boolean> {
        return this.channelMembershipService.isUserChannelMember(userId, channelId);
    }

    async addMember(
        channelId: string,
        data: { userId: string; role?: "moderator" | "user" },
        addedByUserId: string,
    ): Promise<ChannelMember> {
        return this.channelMembershipService.addMember(channelId, data, addedByUserId);
    }

    async getChannelMembers(
        channelId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelMember>,
    ): Promise<PaginatedResult<ChannelMember>> {
        return this.channelMembershipService.getChannelMembers(channelId, pagination, sortBy);
    }

    async getMemberById(memberId: string): Promise<ChannelMember> {
        return this.channelMembershipService.getMemberById(memberId);
    }

    async updateMember(
        memberId: string,
        data: any,
        updatedByUserId: string,
    ): Promise<ChannelMember> {
        return this.channelMembershipService.updateMember(memberId, data, updatedByUserId);
    }

    async removeMember(
        memberId: string,
        removedByUserId: string,
    ): Promise<ChannelMember> {
        return this.channelMembershipService.removeMember(memberId, removedByUserId);
    }

    async getActiveUsers(channelId: string): Promise<string[]> {
        return this.channelMembershipService.getActiveUsers(channelId);
    }

    // Channel Invite Operations

    async createInvite(
        channelId: string,
        data: { email?: string; expiresAt?: Date },
        createdByUserId: string,
    ): Promise<ChannelInvite> {
        return this.channelInviteService.createInvite(channelId, data, createdByUserId);
    }

    async getChannelInvites(
        channelId: string,
        userId: string,
        pagination: Pagination,
        sortBy: SortBy<ChannelInvite>,
    ): Promise<PaginatedResult<ChannelInvite>> {
        return this.channelInviteService.getChannelInvites(channelId, userId, pagination, sortBy);
    }

    async acceptInvite(
        inviteCode: string,
        userId: string,
    ): Promise<ChannelMember> {
        return this.channelInviteService.acceptInvite(inviteCode, userId);
    }

    async deleteInvite(
        inviteId: string,
        deletedByUserId: string,
    ): Promise<ChannelInvite> {
        return this.channelInviteService.deleteInvite(inviteId, deletedByUserId);
    }
}
