import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError, PermissionDeniedError } from "#commons/app/errors.js";

import type { Channel, ChannelMember } from "../../../../src/channels/app/models.js";

import { ChannelManagementService } from "../../../../src/channels/app/channel-management-service.js";

describe("channelManagementService", () => {
    // Mock repositories
    const channelRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
        findByIds: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };

    const channelMemberRepository = {
        create: vi.fn(),
        findByChannelId: vi.fn(),
        findById: vi.fn(),
        findByChannelAndUser: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        countByChannelId: vi.fn(),
        getChannelsByUserId: vi.fn(),
    };

    const channelInviteRepository = {
        create: vi.fn(),
        findByChannelId: vi.fn(),
        findById: vi.fn(),
        findByInviteCode: vi.fn(),
        findValidByEmail: vi.fn(),
        markAsUsed: vi.fn(),
        delete: vi.fn(),
    };

    let service: ChannelManagementService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new ChannelManagementService(
            channelRepository,
            channelMemberRepository,
            channelInviteRepository,
        );
    });

    describe("createChannel", () => {
        it("should create a channel and add creator as owner", async () => {
            // Arrange
            const channelData = {
                name: "Test Channel",
                description: "Test Description",
            };

            const createdChannel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                description: "Test Description",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const createdMember: ChannelMember = {
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
                role: "owner",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
                joinedAt: new Date(),
            };

            channelRepository.create.mockResolvedValue(createdChannel);
            channelMemberRepository.create.mockResolvedValue(createdMember);

            // Act
            const result = await service.createChannel(channelData, "user-1");

            // Assert
            expect(channelRepository.create).toHaveBeenCalledWith({
                ...channelData,
                maxParticipants: 50,
            });

            expect(channelMemberRepository.create).toHaveBeenCalledWith({
                channelId: "channel-1",
                userId: "user-1",
                role: "owner",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
            });

            expect(result).toEqual({
                channel: createdChannel,
                owner: createdMember,
            });
        });
    });

    describe("getChannelById", () => {
        it("should return a channel by ID", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                description: "Test Description",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            channelRepository.findById.mockResolvedValue(channel);

            // Act
            const result = await service.getChannelById("channel-1");

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(result).toEqual(channel);
        });

        it("should throw NotFoundError when channel doesn't exist", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.getChannelById("non-existent")).rejects.toThrow(NotFoundError);
        });
    });

    describe("getUserChannels", () => {
        it("should return user's channels", async () => {
            // Arrange
            const channelIds = ["channel-1", "channel-2"];
            const channels = {
                count: 2,
                data: [
                    { id: "channel-1", name: "Channel 1" },
                    { id: "channel-2", name: "Channel 2" },
                ],
            };

            channelMemberRepository.getChannelsByUserId.mockResolvedValue(channelIds);
            channelRepository.findByIds.mockResolvedValue(channels);

            // Act
            const result = await service.getUserChannels("user-1", { offset: 0, limit: 10 }, [["name", "asc"]]);

            // Assert
            expect(channelMemberRepository.getChannelsByUserId).toHaveBeenCalledWith("user-1");
            expect(channelRepository.findByIds).toHaveBeenCalledWith(
                channelIds,
                { offset: 0, limit: 10 },
                [["name", "asc"]],
            );
            expect(result).toEqual(channels);
        });

        it("should return empty result when user has no channels", async () => {
            // Arrange
            channelMemberRepository.getChannelsByUserId.mockResolvedValue([]);

            // Act
            const result = await service.getUserChannels("user-1", { offset: 0, limit: 10 }, [["name", "asc"]]);

            // Assert
            expect(result).toEqual({ count: 0, data: [] });
            expect(channelRepository.findByIds).not.toHaveBeenCalled();
        });
    });

    describe("updateChannel", () => {
        it("should update channel when user has permission", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                description: "Test Description",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedChannel = {
                ...channel,
                name: "Updated Channel",
                description: "Updated Description",
            };

            const membership: ChannelMember = {
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
                role: "owner",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
                joinedAt: new Date(),
            };

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(membership);
            channelRepository.update.mockResolvedValue(updatedChannel);

            // Act
            const result = await service.updateChannel("channel-1", { name: "Updated Channel", description: "Updated Description" }, "user-1");

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-1");
            expect(channelRepository.update).toHaveBeenCalledWith("channel-1", { name: "Updated Channel", description: "Updated Description" });
            expect(result).toEqual(updatedChannel);
        });

        it("should throw PermissionDeniedError when user is not a member", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.updateChannel("channel-1", { name: "Updated" }, "user-1")).rejects.toThrow(PermissionDeniedError);
        });

        it("should throw PermissionDeniedError when user is not owner or moderator", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.findByChannelAndUser.mockResolvedValue({
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
                role: "user",
                permissions: {},
                joinedAt: new Date(),
            });

            // Act & Assert
            await expect(service.updateChannel("channel-1", { name: "Updated" }, "user-1")).rejects.toThrow(PermissionDeniedError);
        });
    });

    describe("deleteChannel", () => {
        it("should delete channel when user is owner", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                description: "Test Description",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const membership: ChannelMember = {
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
                role: "owner",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
                joinedAt: new Date(),
            };

            const members = {
                count: 1,
                data: [membership],
            };

            const invites = {
                count: 1,
                data: [{ id: "invite-1", channelId: "channel-1" }],
            };

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(membership);
            channelMemberRepository.findByChannelId.mockResolvedValue(members);
            channelInviteRepository.findByChannelId.mockResolvedValue(invites);
            channelMemberRepository.delete.mockResolvedValue(membership);
            channelInviteRepository.delete.mockResolvedValue({ id: "invite-1" });
            channelRepository.delete.mockResolvedValue(channel);

            // Act
            const result = await service.deleteChannel("channel-1", "user-1");

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-1");
            expect(channelMemberRepository.findByChannelId).toHaveBeenCalled();
            expect(channelInviteRepository.findByChannelId).toHaveBeenCalled();
            expect(channelMemberRepository.delete).toHaveBeenCalledWith("member-1");
            expect(channelInviteRepository.delete).toHaveBeenCalledWith("invite-1");
            expect(channelRepository.delete).toHaveBeenCalledWith("channel-1");
            expect(result).toEqual(channel);
        });

        it("should throw PermissionDeniedError when user is not the owner", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.findByChannelAndUser.mockResolvedValue({
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
                role: "moderator",
                permissions: {},
                joinedAt: new Date(),
            });

            // Act & Assert
            await expect(service.deleteChannel("channel-1", "user-1")).rejects.toThrow(PermissionDeniedError);
        });
    });
});
