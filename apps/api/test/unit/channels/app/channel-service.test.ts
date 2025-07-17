import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SortBy } from "#commons/app/index.js";

import type { Channel } from "../../../../src/channels/app/models.js";

import { ChannelService } from "../../../../src/channels/app/channel-service.js";

describe("channelService", () => {
    // Mock repositories
    const channelRepository: any = {};
    const channelMemberRepository: any = {};
    const channelInviteRepository: any = {};
    const activeUsersService: any = {};

    // Mock methods for our service
    const mockCreateChannel = vi.fn();
    const mockGetChannelById = vi.fn();
    const mockGetUserChannels = vi.fn();
    const mockIsUserChannelMember = vi.fn();
    const mockAddMember = vi.fn();
    const mockCreateInvite = vi.fn();
    const mockAcceptInvite = vi.fn();

    let service: ChannelService;

    beforeEach(() => {
        vi.resetAllMocks();

        // Create the service
        service = new ChannelService(
            channelRepository,
            channelMemberRepository,
            channelInviteRepository,
            activeUsersService,
        );

        // Replace the internal service methods with mocks
        service.channelManagementService = {
            createChannel: mockCreateChannel,
            getChannelById: mockGetChannelById,
            getUserChannels: mockGetUserChannels,
        } as any;

        service.channelMembershipService = {
            isUserChannelMember: mockIsUserChannelMember,
            addMember: mockAddMember,
        } as any;

        service.channelInviteService = {
            createInvite: mockCreateInvite,
            acceptInvite: mockAcceptInvite,
        } as any;
    });

    // Channel Management Service Tests
    describe("createChannel", () => {
        it("delegates to channelManagementService.createChannel", async () => {
            // Arrange
            const data = { name: "Test Channel" };
            const userId = "user-1";
            const expectedResult = { channel: { id: "channel-1" }, owner: { id: "member-1" } };
            mockCreateChannel.mockResolvedValue(expectedResult);

            // Act
            const result = await service.createChannel(data, userId);

            // Assert
            expect(mockCreateChannel).toHaveBeenCalledWith(data, userId);
            expect(result).toBe(expectedResult);
        });
    });

    describe("getChannelById", () => {
        it("delegates to channelManagementService.getChannelById", async () => {
            // Arrange
            const channelId = "channel-1";
            const expectedResult = { id: "channel-1", name: "Test Channel" };
            mockGetChannelById.mockResolvedValue(expectedResult);

            // Act
            const result = await service.getChannelById(channelId);

            // Assert
            expect(mockGetChannelById).toHaveBeenCalledWith(channelId);
            expect(result).toBe(expectedResult);
        });
    });

    describe("getUserChannels", () => {
        it("delegates to channelManagementService.getUserChannels", async () => {
            // Arrange
            const userId = "user-1";
            const pagination = { offset: 0, limit: 10 };
            const sortBy: SortBy<Channel> = [["name", "asc"]];
            const expectedResult = { count: 1, data: [{ id: "channel-1" }] };
            mockGetUserChannels.mockResolvedValue(expectedResult);

            // Act
            const result = await service.getUserChannels(userId, pagination, sortBy);

            // Assert
            expect(mockGetUserChannels).toHaveBeenCalledWith(userId, pagination, sortBy);
            expect(result).toBe(expectedResult);
        });
    });

    // Channel Membership Service Tests
    describe("isUserChannelMember", () => {
        it("delegates to channelMembershipService.isUserChannelMember", async () => {
            // Arrange
            const userId = "user-1";
            const channelId = "channel-1";
            const expectedResult = true;
            mockIsUserChannelMember.mockResolvedValue(expectedResult);

            // Act
            const result = await service.isUserChannelMember(userId, channelId);

            // Assert
            expect(mockIsUserChannelMember).toHaveBeenCalledWith(userId, channelId);
            expect(result).toBe(expectedResult);
        });
    });

    describe("addMember", () => {
        it("delegates to channelMembershipService.addMember", async () => {
            // Arrange
            const channelId = "channel-1";
            const data = { userId: "user-2" };
            const addedByUserId = "user-1";
            const expectedResult = { id: "member-1", channelId, userId: "user-2" };
            mockAddMember.mockResolvedValue(expectedResult);

            // Act
            const result = await service.addMember(channelId, data, addedByUserId);

            // Assert
            expect(mockAddMember).toHaveBeenCalledWith(channelId, data, addedByUserId);
            expect(result).toBe(expectedResult);
        });
    });

    // Channel Invite Service Tests
    describe("createInvite", () => {
        it("delegates to channelInviteService.createInvite", async () => {
            // Arrange
            const channelId = "channel-1";
            const data = { email: "test@example.com" };
            const createdByUserId = "user-1";
            const expectedResult = { id: "invite-1", channelId, createdByUserId };
            mockCreateInvite.mockResolvedValue(expectedResult);

            // Act
            const result = await service.createInvite(channelId, data, createdByUserId);

            // Assert
            expect(mockCreateInvite).toHaveBeenCalledWith(channelId, data, createdByUserId);
            expect(result).toBe(expectedResult);
        });
    });

    describe("acceptInvite", () => {
        it("delegates to channelInviteService.acceptInvite", async () => {
            // Arrange
            const inviteCode = "invite-123";
            const userId = "user-1";
            const expectedResult = { id: "member-1", channelId: "channel-1", userId };
            mockAcceptInvite.mockResolvedValue(expectedResult);

            // Act
            const result = await service.acceptInvite(inviteCode, userId);

            // Assert
            expect(mockAcceptInvite).toHaveBeenCalledWith(inviteCode, userId);
            expect(result).toBe(expectedResult);
        });
    });
});
