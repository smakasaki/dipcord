/**
 * Integration tests for channels routes
 * Tests the API endpoints for channel operations
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("channels API", () => {
    const { getServer } = setupApiTest();

    describe("channel CRUD operations", () => {
        it("should create a new channel with 201 status", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            const channelData = {
                name: `Test Channel ${randomUUID().substring(0, 8)}`,
                description: "Channel for testing",
                maxParticipants: 20,
            };

            // Act
            const response = await auth.post("/v1/channels", channelData);

            // Assert
            expect(response.statusCode).toBe(201);

            const channel = JSON.parse(response.body);
            expect(channel.id).toBeDefined();
            expect(channel.name).toBe(channelData.name);
            expect(channel.description).toBe(channelData.description);
            expect(channel.maxParticipants).toBe(channelData.maxParticipants);
            expect(channel.createdAt).toBeDefined();
            expect(channel.updatedAt).toBeDefined();
        });

        it("should get channel by ID", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // First create a channel
            const channelData = {
                name: `Get Channel ${randomUUID().substring(0, 8)}`,
                description: "Channel for retrieval testing",
            };

            const createResponse = await auth.post("/v1/channels", channelData);
            const createdChannel = JSON.parse(createResponse.body);

            // Update data
            const updateData = {
                name: `Updated Channel ${randomUUID().substring(0, 8)}`,
                description: "Updated description",
            };

            // Act
            const response = await auth.put(`/v1/channels/${createdChannel.id}`, updateData);

            // Assert
            expect(response.statusCode).toBe(200);

            const updatedChannel = JSON.parse(response.body);
            expect(updatedChannel.id).toBe(createdChannel.id);
            expect(updatedChannel.name).toBe(updateData.name);
            expect(updatedChannel.description).toBe(updateData.description);
        });

        it("should delete a channel", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // First create a channel
            const channelData = {
                name: `Delete Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await auth.post("/v1/channels", channelData);
            const createdChannel = JSON.parse(createResponse.body);

            // Act
            const deleteResponse = await auth.delete(`/v1/channels/${createdChannel.id}`);

            // Assert
            expect(deleteResponse.statusCode).toBe(204);

            // Verify the channel is actually deleted
            const getResponse = await auth.get(`/v1/channels/${createdChannel.id}`);
            expect(getResponse.statusCode).toBe(404);
        });

        it("should get all channels with pagination", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a few channels to ensure pagination works
            for (let i = 0; i < 3; i++) {
                await auth.post("/v1/channels", {
                    name: `Pagination Channel ${i} ${randomUUID().substring(0, 8)}`,
                });
            }

            // Act - get first page with limit of 2
            const response = await auth.get("/v1/channels?offset=0&limit=2");

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.count).toBeGreaterThanOrEqual(3); // At least the 3 we created
            expect(result.data.length).toBe(2); // Limited to 2 items

            // Act - get second page
            const secondPageResponse = await auth.get("/v1/channels?offset=2&limit=2");

            // Assert
            expect(secondPageResponse.statusCode).toBe(200);

            const secondPageResult = JSON.parse(secondPageResponse.body);
            expect(secondPageResult.count).toBe(result.count); // Same total count
            expect(secondPageResult.data.length).toBeGreaterThan(0); // At least one more item
        });

        it("should return 404 when updating a non-existent channel", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a random UUID that doesn't belong to any channel
            const nonExistentChannelId = randomUUID();

            const updateData = {
                name: `Updated Channel ${randomUUID().substring(0, 8)}`,
                description: "This update should fail",
            };

            // Act
            const response = await auth.put(`/v1/channels/${nonExistentChannelId}`, updateData);

            // Assert
            expect(response.statusCode).toBe(404);

            // Verify the error contains appropriate information
            const errorBody = JSON.parse(response.body);
            expect(errorBody).toHaveProperty("message");
            expect(errorBody.message).toContain(nonExistentChannelId);
        });

        it("should return 403 when a non-owner tries to delete a channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const regularUser = await authenticatedUser(server);

            // Create a channel as the owner
            const channelData = {
                name: `Owner's Channel ${randomUUID().substring(0, 8)}`,
                description: "Channel that only owner should be able to delete",
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the regular user as a member (not owner)
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: regularUser.user.id,
                role: "user",
            });

            // Act - regular user attempts to delete the channel
            const deleteResponse = await regularUser.delete(`/v1/channels/${channel.id}`);

            // Assert
            expect(deleteResponse.statusCode).toBe(403); // Forbidden

            // Verify channel still exists by trying to get it
            const getResponse = await channelOwner.get(`/v1/channels/${channel.id}`);
            expect(getResponse.statusCode).toBe(200);
        });
        it("should correctly sort channels by different fields", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create channels with different names and intentional timing differences
            const channels: any[] = [];

            // Create first channel (alphabetically "C")
            channels.push(
                JSON.parse(
                    (await auth.post("/v1/channels", {
                        name: `C-Sort Test Channel ${randomUUID().substring(0, 8)}`,
                    })).body,
                ),
            );

            // Small delay to ensure different creation timestamps
            await new Promise(resolve => setTimeout(resolve, 50));

            // Create second channel (alphabetically "A")
            channels.push(
                JSON.parse(
                    (await auth.post("/v1/channels", {
                        name: `A-Sort Test Channel ${randomUUID().substring(0, 8)}`,
                    })).body,
                ),
            );

            // Small delay to ensure different creation timestamps
            await new Promise(resolve => setTimeout(resolve, 50));

            // Create third channel (alphabetically "B")
            channels.push(
                JSON.parse(
                    (await auth.post("/v1/channels", {
                        name: `B-Sort Test Channel ${randomUUID().substring(0, 8)}`,
                    })).body,
                ),
            );

            // Act 1 - Get channels sorted by name ascending
            const nameSortAscResponse = await auth.get("/v1/channels?sort=name.asc");

            // Assert
            expect(nameSortAscResponse.statusCode).toBe(200);
            const nameSortAscResult = JSON.parse(nameSortAscResponse.body);

            // Verify sorting by name in ascending order
            expect(nameSortAscResult.data.length).toBeGreaterThanOrEqual(3);

            // Create array of just the test channels we created
            const testChannelsNameAsc = nameSortAscResult.data
                .filter((c: { id: any }) => channels.some(tc => tc.id === c.id))
                .sort((a: { name: string }, b: { name: any }) => a.name.localeCompare(b.name));

            // Verify our test channels are in the expected alphabetical order
            expect(testChannelsNameAsc[0].name.charAt(0)).toBe("A");
            expect(testChannelsNameAsc[1].name.charAt(0)).toBe("B");
            expect(testChannelsNameAsc[2].name.charAt(0)).toBe("C");

            // Act 2 - Get channels sorted by name descending
            const nameSortDescResponse = await auth.get("/v1/channels?sort=name.desc");

            // Assert
            expect(nameSortDescResponse.statusCode).toBe(200);
            const nameSortDescResult = JSON.parse(nameSortDescResponse.body);

            // Create array of just the test channels we created
            const testChannelsNameDesc = nameSortDescResult.data
                .filter((c: { id: any }) => channels.some(tc => tc.id === c.id))
                .sort((a: { name: any }, b: { name: string }) => b.name.localeCompare(a.name));

            // Verify our test channels are in reverse alphabetical order
            expect(testChannelsNameDesc[0].name.charAt(0)).toBe("C");
            expect(testChannelsNameDesc[1].name.charAt(0)).toBe("B");
            expect(testChannelsNameDesc[2].name.charAt(0)).toBe("A");

            // Act 3 - Get channels sorted by creation date ascending (oldest first)
            const dateSortAscResponse = await auth.get("/v1/channels?sort=createdAt.asc");

            // Assert
            expect(dateSortAscResponse.statusCode).toBe(200);
            const dateSortAscResult = JSON.parse(dateSortAscResponse.body);

            // Extract just our test channels and sort by creation date
            const testChannelsDateAsc = dateSortAscResult.data
                .filter((c: { id: any }) => channels.some(tc => tc.id === c.id))
                .sort((a: { createdAt: string | number | Date }, b: { createdAt: string | number | Date }) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            // First channel we created should be first in the list
            expect(testChannelsDateAsc[0].id).toBe(channels[0].id);
            expect(testChannelsDateAsc[1].id).toBe(channels[1].id);
            expect(testChannelsDateAsc[2].id).toBe(channels[2].id);

            // Act 4 - Get channels sorted by creation date descending (newest first)
            const dateSortDescResponse = await auth.get("/v1/channels?sort=createdAt.desc");

            // Assert
            expect(dateSortDescResponse.statusCode).toBe(200);
            const dateSortDescResult = JSON.parse(dateSortDescResponse.body);

            // Extract just our test channels and sort by creation date (descending)
            const testChannelsDateDesc = dateSortDescResult.data
                .filter((c: { id: any }) => channels.some(tc => tc.id === c.id))
                .sort((a: { createdAt: string | number | Date }, b: { createdAt: string | number | Date }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Last channel we created should be first in the list
            expect(testChannelsDateDesc[0].id).toBe(channels[2].id);
            expect(testChannelsDateDesc[1].id).toBe(channels[1].id);
            expect(testChannelsDateDesc[2].id).toBe(channels[0].id);
        });
    });

    describe("channel activity tracking", () => {
        it("should track user activity and return active users", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Activity Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Act - track activity
            const trackResponse = await channelOwner.post(`/v1/channels/${channel.id}/activity`);

            // Assert
            expect(trackResponse.statusCode).toBe(204);

            // Get active users
            const activeUsersResponse = await channelOwner.get(`/v1/channels/${channel.id}/active-users`);

            expect(activeUsersResponse.statusCode).toBe(200);

            const activeUsers = JSON.parse(activeUsersResponse.body);
            expect(activeUsers.activeUsers).toContain(channelOwner.user.id);
        });

        it("should reject activity tracking for a non-member", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const nonMember = await authenticatedUser(server, {
                name: "Non",
                surname: "Member",
                email: `non.member.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create a channel
            const channelData = {
                name: `Activity Tracking Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Verify the non-member is not in the channel members list
            const membersResponse = await channelOwner.get(`/v1/channels/${channel.id}/members`);
            const members = JSON.parse(membersResponse.body);

            const isNotMember = members.data.every((m: { userId: string }) => m.userId !== nonMember.user.id);
            expect(isNotMember).toBe(true);

            // Act - non-member tries to track activity in the channel
            const trackActivityResponse = await nonMember.post(`/v1/channels/${channel.id}/activity`);

            // Assert
            expect(trackActivityResponse.statusCode).toBe(404); // Not Found or 403 Forbidden

            const errorBody = JSON.parse(trackActivityResponse.body);
            expect(errorBody.message).toMatch(/not a member|not found|permission|unauthorized/i);

            // Verify the non-member does not appear in active users
            const activeUsersResponse = await channelOwner.get(`/v1/channels/${channel.id}/active-users`);
            const activeUsers = JSON.parse(activeUsersResponse.body);

            expect(activeUsers.activeUsers).not.toContain(nonMember.user.id);
        });

        it("should allow members to track their activity in a channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const member = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Member Activity Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add the user as a regular member
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: member.user.id,
                role: "user",
            });

            // Act - member tracks their activity
            const trackActivityResponse = await member.post(`/v1/channels/${channel.id}/activity`);

            // Assert
            expect(trackActivityResponse.statusCode).toBe(204); // No Content

            // Verify the member appears in active users
            const activeUsersResponse = await channelOwner.get(`/v1/channels/${channel.id}/active-users`);
            const activeUsers = JSON.parse(activeUsersResponse.body);

            expect(activeUsers.activeUsers).toContain(member.user.id);
        });

        it("should return 404 for activity tracking in a non-existent channel", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a random UUID for a non-existent channel
            const nonExistentChannelId = randomUUID();

            // Act - try to track activity in a non-existent channel
            const trackActivityResponse = await auth.post(`/v1/channels/${nonExistentChannelId}/activity`);

            // Assert
            expect(trackActivityResponse.statusCode).toBe(404); // Not Found

            const errorBody = JSON.parse(trackActivityResponse.body);
            expect(errorBody.message).toContain(nonExistentChannelId);
        });

        it("should show multiple active users in the channel", async () => {
            // Arrange
            const server = getServer();
            const channelOwner = await authenticatedUser(server);
            const member1 = await authenticatedUser(server);
            const member2 = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Multiple Users Activity Channel ${randomUUID().substring(0, 8)}`,
            };

            const createResponse = await channelOwner.post("/v1/channels", channelData);
            const channel = JSON.parse(createResponse.body);

            // Add both members
            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: member1.user.id,
            });

            await channelOwner.post(`/v1/channels/${channel.id}/members`, {
                userId: member2.user.id,
            });

            // Track activity for all three users
            await channelOwner.post(`/v1/channels/${channel.id}/activity`);
            await member1.post(`/v1/channels/${channel.id}/activity`);
            await member2.post(`/v1/channels/${channel.id}/activity`);

            // Act - get active users
            const activeUsersResponse = await channelOwner.get(`/v1/channels/${channel.id}/active-users`);

            // Assert
            expect(activeUsersResponse.statusCode).toBe(200);

            const activeUsers = JSON.parse(activeUsersResponse.body);
            expect(activeUsers.activeUsers).toHaveLength(3);
            expect(activeUsers.activeUsers).toContain(channelOwner.user.id);
            expect(activeUsers.activeUsers).toContain(member1.user.id);
            expect(activeUsers.activeUsers).toContain(member2.user.id);
        });
    });
});
