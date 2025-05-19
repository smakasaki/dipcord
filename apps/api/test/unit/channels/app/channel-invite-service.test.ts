import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ConflictError, NotFoundError, PermissionDeniedError } from "#commons/app/errors.js";

import type { Channel, ChannelInvite, ChannelMember } from "../../../../src/channels/app/models.js";

import { ChannelInviteService } from "../../../../src/channels/app/channel-invite-service.js";

describe("channelInviteService", () => {
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

    let service: ChannelInviteService;

    // Mock the randomUUID function
    vi.mock("node:crypto", () => ({
        randomUUID: () => "mocked-uuid-1234-5678-9012",
    }));

    beforeEach(() => {
        vi.resetAllMocks();
        service = new ChannelInviteService(
            channelRepository,
            channelMemberRepository,
            channelInviteRepository,
        );
    });

    describe("createInvite", () => {
        it("should create an invite when user has permission", async () => {
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

            const createdInvite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "mockeduuid1234567890120",
                isUsed: false,
                createdAt: new Date(),
            };

            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(ownerMembership);
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelInviteRepository.create.mockResolvedValue(createdInvite);

            // Act
            const result = await service.createInvite(
                "channel-1",
                { email: "test@example.com" },
                "owner-1",
            );

            // Assert
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "owner-1");
            expect(channelMemberRepository.countByChannelId).toHaveBeenCalledWith("channel-1");
            expect(channelInviteRepository.create).toHaveBeenCalledWith({
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "mockeduuid1234567890120",
                email: "test@example.com",
                expiresAt: undefined,
            });
            expect(result).toEqual(createdInvite);
        });

        it("should throw PermissionDeniedError when user is not a member", async () => {
            // Arrange
            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.createInvite(
                "channel-1",
                {},
                "non-member",
            )).rejects.toThrow(PermissionDeniedError);
        });

        it("should throw PermissionDeniedError when user doesn't have permission", async () => {
            // Arrange
            const regularMember: ChannelMember = {
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
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

            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(regularMember);

            // Act & Assert
            await expect(service.createInvite(
                "channel-1",
                {},
                "user-1",
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
            await expect(service.createInvite(
                "channel-1",
                {},
                "owner-1",
            )).rejects.toThrow(BadRequestError);
        });
    });

    describe("acceptInvite", () => {
        it("should accept a valid invite and add user as member", async () => {
            // Arrange
            const invite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "valid-code",
                isUsed: false,
                createdAt: new Date(),
            };

            const channel: Channel = {
                id: "channel-1",
                name: "Test Channel",
                maxParticipants: 50,
                accessSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
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

            channelInviteRepository.findByInviteCode.mockResolvedValue(invite);
            channelRepository.findById.mockResolvedValue(channel);
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(undefined);
            channelMemberRepository.create.mockResolvedValue(newMember);

            // Act
            const result = await service.acceptInvite("valid-code", "user-2");

            // Assert
            expect(channelInviteRepository.findByInviteCode).toHaveBeenCalledWith("valid-code");
            expect(channelRepository.findById).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.countByChannelId).toHaveBeenCalledWith("channel-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "user-2");
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
            expect(channelInviteRepository.markAsUsed).toHaveBeenCalledWith("invite-1", "user-2");
            expect(result).toEqual(newMember);
        });

        it("should throw NotFoundError when invite doesn't exist", async () => {
            // Arrange
            channelInviteRepository.findByInviteCode.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.acceptInvite("invalid-code", "user-2")).rejects.toThrow(NotFoundError);
        });

        it("should throw BadRequestError when invite is already used", async () => {
            // Arrange
            const usedInvite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "used-code",
                isUsed: true,
                usedByUserId: "other-user",
                createdAt: new Date(),
            };

            channelInviteRepository.findByInviteCode.mockResolvedValue(usedInvite);

            // Act & Assert
            await expect(service.acceptInvite("used-code", "user-2")).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError when invite is expired", async () => {
            // Arrange
            const expiredInvite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "expired-code",
                isUsed: false,
                expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                createdAt: new Date(),
            };

            channelInviteRepository.findByInviteCode.mockResolvedValue(expiredInvite);

            // Act & Assert
            await expect(service.acceptInvite("expired-code", "user-2")).rejects.toThrow(BadRequestError);
        });

        it("should throw ConflictError when user is already a member", async () => {
            // Arrange
            const invite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "valid-code",
                isUsed: false,
                createdAt: new Date(),
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

            channelInviteRepository.findByInviteCode.mockResolvedValue(invite);
            channelRepository.findById.mockResolvedValue({ id: "channel-1" });
            channelMemberRepository.countByChannelId.mockResolvedValue(1);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(existingMembership);

            // Act & Assert
            await expect(service.acceptInvite("valid-code", "user-2")).rejects.toThrow(ConflictError);
        });
    });

    describe("deleteInvite", () => {
        it("should delete invite when creator deletes it", async () => {
            // Arrange
            const invite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "valid-code",
                isUsed: false,
                createdAt: new Date(),
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

            channelInviteRepository.findById.mockResolvedValue(invite);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(ownerMembership);
            channelInviteRepository.delete.mockResolvedValue(invite);

            // Act
            const result = await service.deleteInvite("invite-1", "owner-1");

            // Assert
            expect(channelInviteRepository.findById).toHaveBeenCalledWith("invite-1");
            expect(channelMemberRepository.findByChannelAndUser).toHaveBeenCalledWith("channel-1", "owner-1");
            expect(channelInviteRepository.delete).toHaveBeenCalledWith("invite-1");
            expect(result).toEqual(invite);
        });

        it("should throw PermissionDeniedError when non-creator without permissions tries to delete", async () => {
            // Arrange
            const invite: ChannelInvite = {
                id: "invite-1",
                channelId: "channel-1",
                createdByUserId: "owner-1",
                inviteCode: "valid-code",
                isUsed: false,
                createdAt: new Date(),
            };

            const regularMember: ChannelMember = {
                id: "member-1",
                channelId: "channel-1",
                userId: "user-1",
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

            channelInviteRepository.findById.mockResolvedValue(invite);
            channelMemberRepository.findByChannelAndUser.mockResolvedValue(regularMember);

            // Act & Assert
            await expect(service.deleteInvite("invite-1", "user-1")).rejects.toThrow(PermissionDeniedError);
        });

        it("should throw NotFoundError when invite doesn't exist", async () => {
            // Arrange
            channelInviteRepository.findById.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.deleteInvite("non-existent", "user-1")).rejects.toThrow(NotFoundError);
        });
    });
});
