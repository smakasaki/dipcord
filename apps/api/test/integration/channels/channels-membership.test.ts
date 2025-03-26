import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("channels API", () => {
    const { getServer } = setupApiTest();

    describe("channel membership operations", () => {
        it("should add a member to a channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const memberToAdd = await authenticatedUser(server, {
                name: "Test",
                surname: "Member",
                email: `test.member.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel as the owner
            const channelData = {
                name: `Member Test Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Act - add the second user as a member
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberToAdd.user.id,
                role: "user",
            });

            // Assert
            expect(addMemberResponse.statusCode).toBe(201);

            const addedMember = JSON.parse(addMemberResponse.body);
            expect(addedMember.channelId).toBe(channel.id);
            expect(addedMember.userId).toBe(memberToAdd.user.id);
            expect(addedMember.role).toBe("user");
        });

        it("should get channel members", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Members List Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Act
            const response = await channelOwner.get(`/v1/channels/${channel.id}/members`);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.count).toBeGreaterThanOrEqual(1); // At least the owner
            expect(result.data.length).toBeGreaterThanOrEqual(1);

            // Verify the owner is in the members list
            const ownerMember = result.data.find((m: any) => m.userId === channelOwner.user.id);
            expect(ownerMember).toBeDefined();
            expect(ownerMember.role).toBe("owner");
        });

        it("should reject adding a duplicate member with 409 status", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const memberToAdd = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Duplicate Member Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the member once
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberToAdd.user.id,
            });

            // Act - try to add the same member again
            const duplicateResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberToAdd.user.id,
            });

            // Assert
            expect(duplicateResponse.statusCode).toBe(409);
        });

        it("should allow removing a member", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const memberToRemove = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Remove Member Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the member
            const addResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberToRemove.user.id,
            });

            const addedMember = JSON.parse(addResponse.body);

            // Act - remove the member
            const removeResponse = await channelOwner.delete(`/v1/channels/members/${addedMember.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(204);

            // Verify member was removed by checking members list
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const foundMember = members.data.find((m: any) => m.userId === memberToRemove.user.id);
            expect(foundMember).toBeUndefined();
        });

        it("should prevent regular members from removing others", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const regularMember1 = await authenticatedUser(server);
            const regularMember2 = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Permission Test Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add both regular members
            // eslint-disable-next-line unused-imports/no-unused-vars
            const addResponse1 = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularMember1.user.id,
            });

            const addResponse2 = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularMember2.user.id,
            });

            const member2Data = JSON.parse(addResponse2.body);

            // Act - have regularMember1 try to remove regularMember2
            const removeResponse = await regularMember1.delete(`/v1/channels/members/${member2Data.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(403); // Forbidden
        });
        it("should allow owner to update a member's role", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const regularUser = await authenticatedUser(server, {
                name: "Regular",
                surname: "Member",
                email: `regular.member.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel as the owner
            const channelData = {
                name: `Role Test Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the regular user as a regular member
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularUser.user.id,
                role: "user", // Start as regular user
            });

            const memberData = JSON.parse(addMemberResponse.body);
            expect(memberData.role).toBe("user");

            // Act - update the member's role to moderator
            const updateRoleResponse = await channelOwner.put(`/v1/channels/members/${memberData.id}/role`, {
                role: "moderator",
            });

            // Assert
            expect(updateRoleResponse.statusCode).toBe(200);

            const updatedMember = JSON.parse(updateRoleResponse.body);
            expect(updatedMember.id).toBe(memberData.id);
            expect(updatedMember.role).toBe("moderator");

            // Verify permissions were updated (moderators should have more permissions)
            expect(updatedMember.permissions.manage_members).toBe(true);
            expect(updatedMember.permissions.manage_messages).toBe(true);
        });

        it("should prevent non-owners from changing member roles", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const moderator = await authenticatedUser(server);
            const regularUser = await authenticatedUser(server);

            // Create a channel as the owner
            const channelData = {
                name: `Role Permissions Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the moderator as a moderator
            const addModeratorResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: moderator.user.id,
                role: "moderator",
            });
                // eslint-disable-next-line unused-imports/no-unused-vars
            const moderatorData = JSON.parse(addModeratorResponse.body);

            // Add the regular user
            const addUserResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularUser.user.id,
                role: "user",
            });
            const userData = JSON.parse(addUserResponse.body);

            // Act - moderator tries to change regular user's role
            const updateRoleResponse = await moderator.put(`/v1/channels/members/${userData.id}/role`, {
                role: "moderator",
            });

            // Assert
            expect(updateRoleResponse.statusCode).toBe(403); // Forbidden
        });

        it("should prevent removal of channel owner", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const moderator = await authenticatedUser(server);

            // Create a channel as the owner
            const channelData = {
                name: `Owner Protection Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the moderator with high permissions
            // eslint-disable-next-line unused-imports/no-unused-vars
            const addModeratorResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: moderator.user.id,
                role: "moderator",
            });

            // Get the channel members to find the owner's membership ID
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            // Find the owner's member object
            const ownerMember = members.data.find((m: { userId: string; role: string }) => m.userId === channelOwner.user.id && m.role === "owner");
            expect(ownerMember).toBeDefined();

            // Act - moderator tries to remove the owner
            const removeResponse = await moderator.delete(`/v1/channels/members/${ownerMember.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(403); // Forbidden

            // Verify error message indicates owner protection
            const errorBody = JSON.parse(removeResponse.body);
            expect(errorBody.message).toContain("owner");

            // Double-check that owner is still a member
            const updatedMembersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const updatedMembers = JSON.parse(updatedMembersResponse.body);
            const ownerStillExists = updatedMembers.data.some((m: { id: any }) => m.id === ownerMember.id);
            expect(ownerStillExists).toBe(true);
        });

        it("should prevent removal of owner even when attempted by the owner", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel as the owner
            const channelData = {
                name: `Self-Remove Protection Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Get the channel members to find the owner's membership ID
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            // Find the owner's member object
            const ownerMember = members.data.find((m: { userId: string; role: string }) => m.userId === channelOwner.user.id && m.role === "owner");
            expect(ownerMember).toBeDefined();

            // Act - owner tries to remove themselves
            const removeResponse = await channelOwner.delete(`/v1/channels/members/${ownerMember.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(403); // Forbidden

            // Verify that owner is still a member
            const updatedMembersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const updatedMembers = JSON.parse(updatedMembersResponse.body);
            const ownerStillExists = updatedMembers.data.some((m: { id: any }) => m.id === ownerMember.id);
            expect(ownerStillExists).toBe(true);
        });

        it("should return a member when requesting by valid ID", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const regularUser = await authenticatedUser(server, {
                name: "Get",
                surname: "Member",
                email: `get.member.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel
            const channelData = {
                name: `Get Member Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add regular user as a member
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularUser.user.id,
                role: "user",
            });

            expect(addMemberResponse.statusCode).toBe(201);
            const memberData = JSON.parse(addMemberResponse.body);
            expect(memberData.id).toBeDefined();

            // Act - get the member by ID
            const getMemberResponse = await channelOwner.get(`/v1/channels/members/${memberData.id}`);

            // Assert
            expect(getMemberResponse.statusCode).toBe(200);

            const returnedMember = JSON.parse(getMemberResponse.body);
            expect(returnedMember).toMatchObject({
                id: memberData.id,
                userId: regularUser.user.id,
                channelId: channel.id,
                role: "user",
            });

            // Check user object is included
            expect(returnedMember.user).toBeDefined();
            expect(returnedMember.user.id).toBe(regularUser.user.id);
            expect(returnedMember.user.name).toBe(regularUser.user.name);
            expect(returnedMember.user.surname).toBe(regularUser.user.surname);
        });

        it("should return 404 when requesting a non-existent member ID", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a non-existent member ID
            const nonExistentMemberId = randomUUID();

            // Act - try to get a non-existent member
            const getMemberResponse = await auth.get(`/v1/channels/members/${nonExistentMemberId}`);

            // Assert
            expect(getMemberResponse.statusCode).toBe(404);

            const errorBody = JSON.parse(getMemberResponse.body);
            expect(errorBody.message).toContain(nonExistentMemberId);
        });

        it("should allow any channel member to view member details", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const memberOne = await authenticatedUser(server);
            const memberTwo = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Member View Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add both members to the channel
            const addMember1Response = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberOne.user.id,
            });
            const member1Data = JSON.parse(addMember1Response.body);

            const addMember2Response = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberTwo.user.id,
            });
            // eslint-disable-next-line unused-imports/no-unused-vars
            const member2Data = JSON.parse(addMember2Response.body);

            // Act - memberTwo tries to view memberOne's details
            const getMemberResponse = await memberTwo.get(`/v1/channels/members/${member1Data.id}`);

            // Assert
            expect(getMemberResponse.statusCode).toBe(200);

            const returnedMember = JSON.parse(getMemberResponse.body);
            expect(returnedMember.id).toBe(member1Data.id);
        });

        it("should allow a regular member to remove themselves from a channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const regularMember = await authenticatedUser(server, {
                name: "Self",
                surname: "Removal",
                email: `self.removal.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel
            const channelData = {
                name: `Self Removal Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the regular member to the channel
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularMember.user.id,
                role: "user",
            });

            const memberData = JSON.parse(addMemberResponse.body);
            expect(memberData.id).toBeDefined();

            // Verify member is in the channel initially
            const membersBeforeResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const membersBeforeData = JSON.parse(membersBeforeResponse.body);

            const memberExists = membersBeforeData.data.some((m: { userId: string }) => m.userId === regularMember.user.id);
            expect(memberExists).toBe(true);

            // Act - member removes themselves from the channel
            const removeResponse = await regularMember.delete(`/v1/channels/members/${memberData.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(204);

            // Verify member is no longer in the channel
            const membersAfterResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const membersAfterData = JSON.parse(membersAfterResponse.body);

            const memberStillExists = membersAfterData.data.some((m: { userId: string }) => m.userId === regularMember.user.id);
            expect(memberStillExists).toBe(false);
        });

        it("should allow a moderator to remove themselves from a channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const moderator = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Moderator Self Removal Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the user as a moderator
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: moderator.user.id,
                role: "moderator",
            });

            const memberData = JSON.parse(addMemberResponse.body);
            expect(memberData.role).toBe("moderator");

            // Act - moderator removes themselves
            const removeResponse = await moderator.delete(`/v1/channels/members/${memberData.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(204);

            // Verify the moderator is no longer in the channel
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const moderatorStillExists = members.data.some((m: { userId: string }) => m.userId === moderator.user.id);
            expect(moderatorStillExists).toBe(false);
        });

        it("should return 404 when trying to remove self with invalid member ID", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a non-existent member ID
            const nonExistentMemberId = randomUUID();

            // Act - try to remove with invalid ID
            const removeResponse = await auth.delete(`/v1/channels/members/${nonExistentMemberId}`);

            // Assert
            expect(removeResponse.statusCode).toBe(404);

            const errorBody = JSON.parse(removeResponse.body);
            expect(errorBody.message).toContain(nonExistentMemberId);
        });

        it("should return 403 when trying to remove a member from a channel user isn't part of", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const memberToRemove = await authenticatedUser(server);
            const nonMember = await authenticatedUser(server, {
                name: "Non",
                surname: "Member",
                email: `non.member.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel
            const channelData = {
                name: `Non-Member Removal Test Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the regular member to the channel (but not the nonMember)
            const addMemberResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: memberToRemove.user.id,
            });

            const memberData = JSON.parse(addMemberResponse.body);

            // Act - non-member tries to remove a member
            const removeResponse = await nonMember.delete(`/v1/channels/members/${memberData.id}`);

            // Assert
            expect(removeResponse.statusCode).toBe(403); // Forbidden

            const errorBody = JSON.parse(removeResponse.body);
            expect(errorBody.message).toMatch(/permission|not a member/i);

            // Verify the member is still in the channel
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const memberStillExists = members.data.some((m: { userId: string }) => m.userId === memberToRemove.user.id);
            expect(memberStillExists).toBe(true);
        });

        it("should reject adding a member when channel has reached its max participants", async () => {
        // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a small channel with capacity of just 2 members
            const channelData = {
                name: `Limited Capacity Channel ${randomUUID().substring(0, 8)}`,
                description: "Channel with small capacity for testing",
                maxParticipants: 2, // Owner + 1 additional member
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            expect(createResponse.statusCode).toBe(201);

            const channel = JSON.parse(createResponse.body);
            expect(channel.maxParticipants).toBe(2);

            // First additional member (should succeed and reach capacity)
            const firstMember = await authenticatedUser(server);
            const addFirstResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: firstMember.user.id,
            });
            expect(addFirstResponse.statusCode).toBe(201);

            // Second additional member (should be rejected due to capacity)
            const secondMember = await authenticatedUser(server);

            // Act - try to add one more member beyond capacity
            const addSecondResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: secondMember.user.id,
            });

            // Assert
            expect(addSecondResponse.statusCode).toBe(400); // Bad Request

            const errorBody = JSON.parse(addSecondResponse.body);
            expect(errorBody.message).toMatch(/capacity|maximum|limit|full/i);

            // Verify the channel still has exactly 2 members
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            expect(members.count).toBe(2);
            expect(members.data.length).toBe(2);
        });

        it("should still allow channel owner to update the channel when full", async () => {
        // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel with minimum capacity
            const channelData = {
                name: `Update When Full Channel ${randomUUID().substring(0, 8)}`,
                maxParticipants: 2, // Owner + 1 additional member
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add a member to reach capacity
            const member = await authenticatedUser(server);
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: member.user.id,
            });

            // Prepare update data
            const newName = `Updated Full Channel ${randomUUID().substring(0, 8)}`;
            const updateData = {
                name: newName,
                description: "This channel has been updated while at capacity",
            };

            // Act - update the channel while it's at capacity
            const updateResponse = await channelOwner.put(`/v1/channels/${channel.id}`, updateData);

            // Assert
            expect(updateResponse.statusCode).toBe(200);

            const updatedChannel = JSON.parse(updateResponse.body);
            expect(updatedChannel.name).toBe(newName);
            expect(updatedChannel.description).toBe(updateData.description);
        });

        it("should be possible to increase the max participants and then add more members", async () => {
        // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel with small initial capacity
            const channelData = {
                name: `Expandable Channel ${randomUUID().substring(0, 8)}`,
                maxParticipants: 2, // Owner + 1 additional member
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add a member to reach capacity
            const firstMember = await authenticatedUser(server);
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: firstMember.user.id,
            });

            // Verify trying to add another member fails due to capacity
            const secondMember = await authenticatedUser(server);
            const failedAddResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: secondMember.user.id,
            });
            expect(failedAddResponse.statusCode).toBe(400);

            // Act - increase the channel capacity
            const updateResponse = await channelOwner.put(`/v1/channels/${channel.id}`, {
                maxParticipants: 3, // Increase to allow one more member
            });

            expect(updateResponse.statusCode).toBe(200);
            const updatedChannel = JSON.parse(updateResponse.body);
            expect(updatedChannel.maxParticipants).toBe(3);

            // Now try adding another member again
            const successAddResponse = await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: secondMember.user.id,
            });

            // Assert - member should be added successfully now
            expect(successAddResponse.statusCode).toBe(201);

            // Verify the channel now has 3 members
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            expect(members.count).toBe(3);
            expect(members.data.length).toBe(3);

            // Verify second member was added
            const secondMemberExists = members.data.some((m: { userId: string }) => m.userId === secondMember.user.id);
            expect(secondMemberExists).toBe(true);
        });
    });
});
