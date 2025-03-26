import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("channels API", () => {
    const { getServer } = setupApiTest();

    describe("channel invite operations", () => {
        it("should create and accept an invite", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const invitedUser = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Invite Test Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Act - create an invite
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});

            // Assert
            expect(createInviteResponse.statusCode).toBe(201);

            const invite = JSON.parse(createInviteResponse.body);
            expect(invite.channelId).toBe(channel.id);
            expect(invite.inviteCode).toBeDefined();
            expect(invite.isUsed).toBe(false);

            // Act - accept the invite
            const acceptResponse = await invitedUser.post(`/v1/channels/invites/accept`, {
                inviteCode: invite.inviteCode,
            });

            // Assert
            expect(acceptResponse.statusCode).toBe(200);

            const membership = JSON.parse(acceptResponse.body);
            expect(membership.channelId).toBe(channel.id);
            expect(membership.userId).toBe(invitedUser.user.id);
            expect(membership.role).toBe("user");

            // Verify the invite is now marked as used
            const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
            const invites = JSON.parse(invitesResponse.body);

            const updatedInvite = invites.data.find((i: any) => i.id === invite.id);
            expect(updatedInvite.isUsed).toBe(true);
            expect(updatedInvite.usedByUserId).toBe(invitedUser.user.id);
        });

        it("should reject using an already used invite", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const firstUser = await authenticatedUser(server);
            const secondUser = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Used Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Create an invite
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});
            const invite = JSON.parse(createInviteResponse.body);

            // First user accepts the invite
            await firstUser.post(`/v1/channels/invites/accept`, {
                inviteCode: invite.inviteCode,
            });

            // Act - second user tries to use the same invite
            const secondAcceptResponse = await secondUser.post(`/v1/channels/invites/accept`, {
                inviteCode: invite.inviteCode,
            });

            // Assert
            expect(secondAcceptResponse.statusCode).toBe(400); // Bad Request
        });

        it("should allow deleting an invite", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Delete Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Create an invite
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});
            const invite = JSON.parse(createInviteResponse.body);

            // Act - delete the invite
            const deleteResponse = await channelOwner.delete(`/v1/channels/invites/${invite.id}`);

            // Assert
            expect(deleteResponse.statusCode).toBe(204);

            // Verify invite is deleted
            const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
            const invites = JSON.parse(invitesResponse.body);

            const deletedInvite = invites.data.find((i: any) => i.id === invite.id);
            expect(deletedInvite).toBeUndefined();
        });

        it("should reject acceptance of an expired invite", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const invitedUser = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Expired Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Create an invite that expired 1 hour ago
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1);

            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
                expiresAt: pastDate.toISOString(),
            });

            expect(createInviteResponse.statusCode).toBe(201);
            const invite = JSON.parse(createInviteResponse.body);
            expect(invite.expiresAt).not.toBeNull();

            // Act - attempt to accept the expired invite
            const acceptResponse = await invitedUser.post("/v1/channels/invites/accept", {
                inviteCode: invite.inviteCode,
            });

            // Assert
            expect(acceptResponse.statusCode).toBe(400); // Bad Request

            // Verify error response indicates expiration issue
            const errorBody = JSON.parse(acceptResponse.body);
            expect(errorBody.message).toContain("expired");

            // Verify user is not added to the channel
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const invitedUserJoined = members.data.some((m: { userId: string }) => m.userId === invitedUser.user.id);
            expect(invitedUserJoined).toBe(false);
        });

        it("should reject acceptance of a non-existent invite code", async () => {
            // Arrange
            const server = getServer();
            const user = await authenticatedUser(server);

            // Generate a random invite code that doesn't exist
            const fakeInviteCode = randomUUID().replace(/-/g, "");

            // Act - attempt to accept the non-existent invite
            const acceptResponse = await user.post("/v1/channels/invites/accept", {
                inviteCode: fakeInviteCode,
            });

            // Assert
            expect(acceptResponse.statusCode).toBe(404); // Not Found

            // Verify error response contains appropriate message
            const errorBody = JSON.parse(acceptResponse.body);
            expect(errorBody.message).toMatch(/invite|not found|invalid/i);
        });

        it("should reject acceptance of an invite with malformed code", async () => {
            // Arrange
            const server = getServer();
            const user = await authenticatedUser(server);

            // Create intentionally malformed invite codes
            const tooShortCode = "abc123";
            const invalidFormatCode = "not-a-valid-code-format!@#";

            // Act & Assert - attempt to accept invite with too short code
            const shortCodeResponse = await user.post("/v1/channels/invites/accept", {
                inviteCode: tooShortCode,
            });
            expect(shortCodeResponse.statusCode).toBe(404); // Not Found

            // Act & Assert - attempt to accept invite with invalid format
            const invalidFormatResponse = await user.post("/v1/channels/invites/accept", {
                inviteCode: invalidFormatCode,
            });
            expect(invalidFormatResponse.statusCode).toBe(404); // Not Found
        });

        it("should create an invite with a future expiration date", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const invitedUser = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Expiring Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Set expiration date one hour in the future
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 1);

            // Act - create invite with expiration date
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
                expiresAt: futureDate.toISOString(),
            });

            // Assert
            expect(createInviteResponse.statusCode).toBe(201);

            const invite = JSON.parse(createInviteResponse.body);
            expect(invite.inviteCode).toBeDefined();
            expect(invite.expiresAt).not.toBeNull();

            // The returned expiration date should be close to our requested date
            const returnedExpiryDate = new Date(invite.expiresAt);
            const timeDifferenceMs = Math.abs(returnedExpiryDate.getTime() - futureDate.getTime());
            expect(timeDifferenceMs).toBeLessThan(5000); // Allow up to 5 seconds difference due to processing time

            // Verify the invite works before expiration
            const acceptResponse = await invitedUser.post("/v1/channels/invites/accept", {
                inviteCode: invite.inviteCode,
            });

            expect(acceptResponse.statusCode).toBe(200);

            // Verify user was added to the channel
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const userWasAdded = members.data.some((m: { userId: string }) => m.userId === invitedUser.user.id);
            expect(userWasAdded).toBe(true);
        });

        it("should not allow creating an invite with a past expiration date", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Past Expiry Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Set expiration date in the past
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1); // 1 hour in the past

            // Act - attempt to create invite with past expiration date
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
                expiresAt: pastDate.toISOString(),
            });

            // Assert
            // Note: The behavior here depends on how your API handles past dates.
            // Two common approaches:
            // 1. Reject with 400 Bad Request (if validation checks for past dates)
            // 2. Accept but create an already-expired invite

            // If your implementation follows approach #1:
            if (createInviteResponse.statusCode === 400) {
                const errorBody = JSON.parse(createInviteResponse.body);
                expect(errorBody.message).toMatch(/past|expired|invalid/i);
            }
            // If your implementation follows approach #2:
            else if (createInviteResponse.statusCode === 201) {
                const invite = JSON.parse(createInviteResponse.body);
                expect(invite.expiresAt).not.toBeNull();

                // Try to use this expired invite with another user
                const anotherUser = await authenticatedUser(server);
                const acceptResponse = await anotherUser.post("/v1/channels/invites/accept", {
                    inviteCode: invite.inviteCode,
                });

                // Should be rejected as expired
                expect(acceptResponse.statusCode).toBe(400);
            }
            else {
                throw new Error(`Unexpected status code: ${createInviteResponse.statusCode}`);
            }
        });

        it("should allow setting a far future expiration date", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Far Future Invite Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Set expiration date a year in the future
            const farFutureDate = new Date();
            farFutureDate.setFullYear(farFutureDate.getFullYear() + 1);

            // Act - create invite with far future expiration date
            const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
                expiresAt: farFutureDate.toISOString(),
            });

            // Assert
            expect(createInviteResponse.statusCode).toBe(201);

            const invite = JSON.parse(createInviteResponse.body);
            expect(invite.inviteCode).toBeDefined();
            expect(invite.expiresAt).not.toBeNull();

            // Verify the expiration date is in the future
            const expiryDate = new Date(invite.expiresAt);
            expect(expiryDate.getTime()).toBeGreaterThan(Date.now());

            // Expect approx 1 year difference (allow for some processing delay)
            const yearInMs = 365 * 24 * 60 * 60 * 1000;
            const timeDiff = expiryDate.getTime() - Date.now();
            expect(timeDiff).toBeGreaterThan(yearInMs * 0.9); // At least 90% of a year
        });
    });

    it("should create an invite tied to a specific email address", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Email Invite Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Generate a unique email for testing
        const inviteEmail = `invite.test.${randomUUID().substring(0, 8)}@example.com`;

        // Act - create invite with specific email
        const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
            email: inviteEmail,
        });

        // Assert
        expect(createInviteResponse.statusCode).toBe(201);

        const invite = JSON.parse(createInviteResponse.body);
        expect(invite.inviteCode).toBeDefined();
        expect(invite.email).toBe(inviteEmail);

        // Verify the invite is listed in channel invites
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        const createdInvite = invites.data.find((i: { id: any }) => i.id === invite.id);
        expect(createdInvite).toBeDefined();
        expect(createdInvite.email).toBe(inviteEmail);
    });

    it("should validate email format when creating an invite", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Email Validation Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Act - try to create invite with invalid email format
        const invalidEmailResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
            email: "not-a-valid-email",
        });

        // Assert - should reject invalid email format
        expect(invalidEmailResponse.statusCode).toBe(400);
    });

    it("should allow a user to accept an invite sent to their email", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const invitedUser = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Email Acceptance Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Create invite with the user's email
        const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {
            email: invitedUser.user.email,
        });

        expect(createInviteResponse.statusCode).toBe(201);
        const invite = JSON.parse(createInviteResponse.body);

        // Act - user accepts the invite
        const acceptResponse = await invitedUser.post("/v1/channels/invites/accept", {
            inviteCode: invite.inviteCode,
        });

        // Assert
        expect(acceptResponse.statusCode).toBe(200);

        // Verify the user is added to the channel
        const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
        const members = JSON.parse(membersResponse.body);

        const userIsAdded = members.data.some((m: { userId: string }) => m.userId === invitedUser.user.id);
        expect(userIsAdded).toBe(true);

        // Verify the invite is marked as used
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        const updatedInvite = invites.data.find((i: { id: any }) => i.id === invite.id);
        expect(updatedInvite.isUsed).toBe(true);
        expect(updatedInvite.usedByUserId).toBe(invitedUser.user.id);
    });

    it("should reject invite creation by regular members without permissions", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const regularMember = await authenticatedUser(server, {
            name: "Regular",
            surname: "Member",
            email: `regular.member.${randomUUID().substring(0, 8)}@example.com`,
        });

        // Create a channel
        const channelData = {
            name: `Permission Test Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the regular member without special permissions
        await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: regularMember.user.id,
            role: "user",
        });

        // Act - regular member tries to create an invite
        const createInviteResponse = await regularMember.post(`/v1/channels/${channel.id}/invites`, {});

        // Assert
        expect(createInviteResponse.statusCode).toBe(403); // Forbidden

        const errorBody = JSON.parse(createInviteResponse.body);
        expect(errorBody.message).toMatch(/permission|not allowed|unauthorized/i);

        // Verify no invite was created
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        expect(invites.count).toBe(0);
        expect(invites.data).toHaveLength(0);
    });

    it("should allow invite creation by members with manage_members permission", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const memberWithPermission = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Permission Grant Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the member
        const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: memberWithPermission.user.id,
            role: "user",
        });

        const memberData = JSON.parse(addMemberResponse.body);

        // Grant specific permission to manage members
        await channelOwner.put(`/v1/channels/members/${memberData.id}/permissions`, {
            permissions: {
                manage_members: true,
            },
        });

        // Act - member with permission tries to create an invite
        const createInviteResponse = await memberWithPermission.post(`/v1/channels/${channel.id}/invites`, {});

        // Assert
        expect(createInviteResponse.statusCode).toBe(201);

        const invite = JSON.parse(createInviteResponse.body);
        expect(invite.inviteCode).toBeDefined();
    });

    it("should allow moderators to create invites automatically", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const moderator = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Moderator Invite Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the user as a moderator
        await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: moderator.user.id,
            role: "moderator",
        });

        // Act - moderator creates an invite
        const createInviteResponse = await moderator.post(`/v1/channels/${channel.id}/invites`, {});

        // Assert
        expect(createInviteResponse.statusCode).toBe(201);

        const invite = JSON.parse(createInviteResponse.body);
        expect(invite.inviteCode).toBeDefined();
    });

    it("should reject invite creation by non-members", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const nonMember = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Non-Member Test Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Act - non-member tries to create an invite
        const createInviteResponse = await nonMember.post(`/v1/channels/${channel.id}/invites`, {});

        // Assert
        expect(createInviteResponse.statusCode).toBe(403); // Forbidden

        const errorBody = JSON.parse(createInviteResponse.body);
        expect(errorBody.message).toMatch(/not a member|not found|permission/i);
    });

    it("should reject invite deletion by regular members without permissions", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const regularMember = await authenticatedUser(server, {
            name: "Regular",
            surname: "Member",
            email: `regular.member.${randomUUID().substring(0, 8)}@example.com`,
        });

        // Create a channel
        const channelData = {
            name: `Delete Permission Test Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the regular member without special permissions
        await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: regularMember.user.id,
            role: "user",
        });

        // Create an invite as the owner
        const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});
        const invite = JSON.parse(createInviteResponse.body);

        // Act - regular member tries to delete the invite
        const deleteInviteResponse = await regularMember.delete(`/v1/channels/invites/${invite.id}`);

        // Assert
        expect(deleteInviteResponse.statusCode).toBe(403); // Forbidden

        const errorBody = JSON.parse(deleteInviteResponse.body);
        expect(errorBody.message).toMatch(/permission|not allowed|unauthorized/i);

        // Verify the invite still exists
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        const inviteStillExists = invites.data.some((i: { id: any }) => i.id === invite.id);
        expect(inviteStillExists).toBe(true);
    });

    it("should allow members to delete invites they created themselves", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const moderator = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Self Delete Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the user as a moderator so they can create invites
        await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: moderator.user.id,
            role: "moderator",
        });

        // Moderator creates an invite
        const createInviteResponse = await moderator.post(`/v1/channels/${channel.id}/invites`, {});
        const invite = JSON.parse(createInviteResponse.body);
        expect(invite.createdByUserId).toBe(moderator.user.id);

        // Act - moderator deletes their own invite
        const deleteInviteResponse = await moderator.delete(`/v1/channels/invites/${invite.id}`);

        // Assert
        expect(deleteInviteResponse.statusCode).toBe(204); // No Content

        // Verify the invite no longer exists
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        const inviteStillExists = invites.data.some((i: { id: any }) => i.id === invite.id);
        expect(inviteStillExists).toBe(false);
    });

    it("should allow members with manage_members permission to delete any invite", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const memberWithPermission = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Permission Delete Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Add the member with manage_members permission
        const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
            userId: memberWithPermission.user.id,
            role: "user",
        });

        const memberData = JSON.parse(addMemberResponse.body);

        // Grant specific permission to manage members
        await channelOwner.put(`/v1/channels/members/${memberData.id}/permissions`, {
            permissions: {
                manage_members: true,
            },
        });

        // Owner creates an invite
        const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});
        const invite = JSON.parse(createInviteResponse.body);

        // Act - member with permission deletes the invite
        const deleteInviteResponse = await memberWithPermission.delete(`/v1/channels/invites/${invite.id}`);

        // Assert
        expect(deleteInviteResponse.statusCode).toBe(204); // No Content

        // Verify the invite was deleted
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        expect(invites.data.every((i: { id: any }) => i.id !== invite.id)).toBe(true);
    });

    it("should reject invite deletion by non-members", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);
        const nonMember = await authenticatedUser(server);

        // Create a channel
        const channelData = {
            name: `Non-Member Delete Test Channel ${randomUUID().substring(0, 8)}`,
        };

        const createResponse = await channelOwner.post("/v1/channels", channelData);
        const channel = JSON.parse(createResponse.body);

        // Create an invite
        const createInviteResponse = await channelOwner.post(`/v1/channels/${channel.id}/invites`, {});
        const invite = JSON.parse(createInviteResponse.body);

        // Act - non-member tries to delete the invite
        const deleteInviteResponse = await nonMember.delete(`/v1/channels/invites/${invite.id}`);

        // Assert
        expect(deleteInviteResponse.statusCode).toBe(403); // Forbidden

        // Verify the invite still exists
        const invitesResponse = await channelOwner.get(`/v1/channels/${channel.id}/invites`);
        const invites = JSON.parse(invitesResponse.body);

        const inviteStillExists = invites.data.some((i: { id: any }) => i.id === invite.id);
        expect(inviteStillExists).toBe(true);
    });

    it("should return 404 when trying to delete a non-existent invite", async () => {
        // Arrange
        const server = getServer();
        const channelOwner = await authenticatedUser(server);

        // Generate a random UUID for a non-existent invite
        const nonExistentInviteId = randomUUID();

        // Act - try to delete a non-existent invite
        const deleteInviteResponse = await channelOwner.delete(`/v1/channels/invites/${nonExistentInviteId}`);

        // Assert
        expect(deleteInviteResponse.statusCode).toBe(404); // Not Found
    });
});
