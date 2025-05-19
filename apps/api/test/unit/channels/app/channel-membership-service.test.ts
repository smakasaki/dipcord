import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ConflictError, NotFoundError, PermissionDeniedError } from "#commons/app/errors.js";

import type { Channel, ChannelMember } from "../../../../src/channels/app/models.js";

import { ChannelMembershipService } from "../../../../src/channels/app/channel-membership-service.js";

describe("channelMembershipService", () => {
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

    // Create a mock with any type to satisfy the TypeScript compiler
    const activeUsersService: any = {
        getAllActiveUsers: vi.fn(),
    };

    let service: ChannelMembershipService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new ChannelMembershipService(
            channelRepository,
            channelMemberRepository,
            activeUsersService,
        );
    });

    describe("isUserChannelMember", () => {
        it("should return true when user is a member", async () => {
            // Arrange
            channelMemberRepository.findByChannelAndUser.mockResolvedValue({
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
            });

            // Act
            const result = await service.isUserChannelMember("user-1", "channel-1");

            // Assert
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-1");
            expect(result).toBe(true);
        });

        it("should return false when user is not a member", async () => {
            // Arrange
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(undefined);

            // Act
            const result = await service.isUserChannelMember("user-1", "channel-1");

            // Assert
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-1");
            expect(result).toBe(false);
        });
    });

    describe("addMember", () => {
        it("should add a member with default permissions", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const ownerMembership: ChannelMember = {
                id: "member-owner",
                channelId: "channel-1",
                userId: "owner-1",
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

            const newMember: ChannelMember = {
                id: "member-2",
                channelId: "channel-1",
                userId: "user-2",
                role: "user",
                permissions: {
                    manage_members: false,
                    manage_messages: false,
                    manage_tasks: false,
                    manage_calls: false,
                    manage_polls: false,
                },
                joinedAt: new Date(),
            };

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelAndUser
                .mockResolvedValueOnce(ownerMembership) // For owner check
                .mockResolvedValueOnce(undefined); // For new member check
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelMemberRepository.create.mockResolvedValue(newMember);

            // Act
            const result = await service.addMember(
                "channel-1",
                { userId: "user-2" },
                "owner-1",
            );

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "owner-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-2");
            expect(channelMemberRepository.countByChannelId).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.create).toHaveBeenCalledWith({
                channelId: "channel-1",
                userId: "user-2",
                role: "user",
                permissions: {
                    manage_members: false,
                    manage_messages: false,
                    manage_tasks: false,
                    manage_calls: false,
                    manage_polls: false,
                },
            });
            expect(result).toEqual(newMember);
        });

        it("should add a moderator when owner adds with moderator role", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const ownerMembership: ChannelMember = {
                id: "member-owner",
                channelId: "channel-1",
                userId: "owner-1",
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

            const newModerator: ChannelMember = {
                id: "member-2",
                channelId: "channel-1",
                userId: "user-2",
                role: "moderator",
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
            channelMemberRepository.findByChannelAndUser
                .mockResolvedValueOnce(ownerMembership) // For owner check
                .mockResolvedValueOnce(undefined); // For new member check
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelMemberRepository.create.mockResolvedValue(newModerator);

            // Act
            const result = await service.addMember(
                "channel-1",
                { userId: "user-2", role: "moderator" },
                "owner-1",
            );

            // Assert
            expect(channelMemberRepository.create).toHaveBeenCalledWith({
                channelId: "channel-1",
                userId: "user-2",
                role: "moderator",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
            });
            expect(result).toEqual(newModerator);
        });

        it("should throw PermissionDeniedError when non-owner tries to add moderator", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const moderatorMembership: ChannelMember = {
                id: "member-mod",
                channelId: "channel-1",
                userId: "mod-1",
                role: "moderator",
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
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(moderatorMembership);
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelMemberRepository.findByChannelAndUser
                .mockResolvedValueOnce(moderatorMembership) // For moderator check
                .mockResolvedValueOnce(undefined); // For new member check

            // Act & Assert
            await expect(service.addMember(
                "channel-1",
                { userId: "user-2", role: "moderator" },
                "mod-1",
            )).rejects.toThrow(PermissionDeniedError);
        });

        it("should throw BadRequestError when channel is full", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 2,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const ownerMembership: ChannelMember = {
                id: "member-owner",
                channelId: "channel-1",
                userId: "owner-1",
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
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(ownerMembership);
            channelMemberRepository.countByChannelId.mockResolvedValue(2); // Already full

            // Act & Assert
            await expect(service.addMember(
                "channel-1",
                { userId: "user-2" },
                "owner-1",
            )).rejects.toThrow(BadRequestError);
        });

        it("should throw ConflictError when user is already a member", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const ownerMembership: ChannelMember = {
                id: "member-owner",
                channelId: "channel-1",
                userId: "owner-1",
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

            const existingMembership: ChannelMember = {
                id: "member-2",
                channelId: "channel-1",
                userId: "user-2",
                role: "user",
                permissions: {
                    manage_members: false,
                    manage_messages: false,
                    manage_tasks: false,
                    manage_calls: false,
                    manage_polls: false,
                },
                joinedAt: new Date(),
            };

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelAndUser
                .mockResolvedValueOnce(ownerMembership) // For owner check
                .mockResolvedValueOnce(existingMembership); // For new member check
            channelMemberRepository.countByChannelId.mockResolvedValue(2);

            // Act & Assert
            await expect(service.addMember(
                "channel-1",
                { userId: "user-2" },
                "owner-1",
            )).rejects.toThrow(ConflictError);
        });
    });

    describe("getActiveUsers", () => {
        it("should return intersection of channel members and active users", async () => {
            // Arrange
            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const members = {
                count: 3,
                data: [
                    { id: "member-1", channelId: "channel-1", userId: "user-1" },
                    { id: "member-2", channelId: "channel-1", userId: "user-2" },
                    { id: "member-3", channelId: "channel-1", userId: "user-3" },
                ],
            };

            const activeUsers = ["user-1", "user-3", "user-4"];

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelId.mockResolvedValue(members);
            activeUsersService.getAllActiveUsers.mockResolvedValue(activeUsers);

            // Act
            const result = await service.getActiveUsers("channel-1");

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelId).toHaveBeenCalledWith(
                "channel-1",
                { offset: 0, limit: 1000 },
                [["id", "asc"]],
            );
            expect(activeUsersService.getAllActiveUsers).toHaveBeenCalled();
            expect(result).toEqual(["user-1", "user-3"]);
        });

        it("should throw NotFoundError when channel doesn't exist", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.getActiveUsers("non-existent")).rejects.toThrow(NotFoundError);
        });
    });
});
