/**
 * Integration tests for messages routes
 * Tests the API endpoints for message operations
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

// Set to true to show response bodies for failed tests
const DEBUG = true;

describe("messages API", () => {
    const { getServer } = setupApiTest();

    describe("message CRUD operations", () => {
        it("should create a new message in a channel with 201 status", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // First create a channel
            const channelData = {
                name: `Message Test Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);

            if (DEBUG && createChannelResponse.statusCode !== 201) {
                console.log("Channel creation failed:", createChannelResponse.statusCode, createChannelResponse.body);
            }

            expect(createChannelResponse.statusCode).toBe(201);
            const channel = JSON.parse(createChannelResponse.body);

            const messageData = {
                channelId: channel.id,
                content: "This is a test message",
            };

            // Act
            const response = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);

            if (DEBUG && response.statusCode !== 201) {
                console.log("Message creation failed:", response.statusCode, response.body);
            }

            // Assert
            expect(response.statusCode).toBe(201);

            const message = JSON.parse(response.body);
            expect(message.id).toBeDefined();
            expect(message.content).toBe(messageData.content);
            expect(message.channelId).toBe(channel.id);
            expect(message.userId).toBe(auth.user.id);
            expect(message.createdAt).toBeDefined();
            expect(message.updatedAt).toBeDefined();
            expect(message.attachments).toEqual([]);
        });

        it("should get messages from a channel", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message Retrieval Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a few messages
            const messageContents = [
                "First test message",
                "Second test message",
                "Third test message",
            ];

            for (const content of messageContents) {
                await auth.post(`/v1/channels/${channel.id}/messages`, { content });
            }

            // Act
            const response = await auth.get(`/v1/channels/${channel.id}/messages`);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.data.length).toBeGreaterThanOrEqual(3);
            expect(result.count).toBeGreaterThanOrEqual(3);

            // Verify the messages we created are present
            const messageTexts = result.data.map((msg: any) => msg.content);
            for (const content of messageContents) {
                expect(messageTexts).toContain(content);
            }
        });

        it("should get messages with pagination", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message Pagination Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create 5 messages
            const messageContents = [];
            for (let i = 0; i < 5; i++) {
                const content = `Pagination test message ${i}`;
                messageContents.push(content);
                await auth.post(`/v1/channels/${channel.id}/messages`, { content });
            }

            // Act - get first page with limit of 2
            const response = await auth.get(`/v1/channels/${channel.id}/messages?limit=2`);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.data.length).toBe(2);
            expect(result.count).toBe(2);

            // Check for cursor in header
            expect(response.headers["x-next-cursor"]).toBeDefined();
            const cursor = response.headers["x-next-cursor"];

            // Act - get second page using cursor
            const secondPageResponse = await auth.get(`/v1/channels/${channel.id}/messages?limit=2&cursor=${cursor}`);

            // Assert
            expect(secondPageResponse.statusCode).toBe(200);

            const secondPageResult = JSON.parse(secondPageResponse.body);
            expect(secondPageResult.data.length).toBe(2);
            expect(secondPageResult.data[0].id).not.toBe(result.data[0].id);
        });

        it("should get a message by ID", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message By ID Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a message
            const messageData = {
                content: "Test message for retrieval by ID",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const createdMessage = JSON.parse(createMessageResponse.body);

            // Act
            const response = await auth.get(`/v1/messages/${createdMessage.id}`);

            // Assert
            expect(response.statusCode).toBe(200);

            const message = JSON.parse(response.body);
            expect(message.message.id).toBe(createdMessage.id);
            expect(message.message.content).toBe(messageData.content);
            expect(message.message.channelId).toBe(channel.id);
            expect(message.message.userId).toBe(auth.user.id);
        });

        it("should update a message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message Update Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a message
            const messageData = {
                content: "Original message content",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const createdMessage = JSON.parse(createMessageResponse.body);

            // Update data
            const updateData = {
                content: "Updated message content",
            };

            // Act
            const response = await auth.put(`/v1/messages/${createdMessage.id}`, updateData);

            // Assert
            expect(response.statusCode).toBe(200);

            const updatedMessage = JSON.parse(response.body);
            expect(updatedMessage.id).toBe(createdMessage.id);
            expect(updatedMessage.content).toBe(updateData.content);
            expect(updatedMessage.isEdited).toBe(true);

            // Verify update persisted by getting the message
            const getResponse = await auth.get(`/v1/messages/${createdMessage.id}`);
            const retrievedMessage = JSON.parse(getResponse.body);
            expect(retrievedMessage.message.content).toBe(updateData.content);
        });

        it("should delete a message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message Delete Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a message
            const messageData = {
                content: "Message to be deleted",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const createdMessage = JSON.parse(createMessageResponse.body);

            // Act
            const deleteResponse = await auth.delete(`/v1/messages/${createdMessage.id}`);

            // Assert
            expect(deleteResponse.statusCode).toBe(200);

            const deletedMessage = JSON.parse(deleteResponse.body);
            expect(deletedMessage.id).toBe(createdMessage.id);
            expect(deletedMessage.isDeleted).toBe(true);

            // Verify the message is marked as deleted when retrieved
            const getResponse = await auth.get(`/v1/messages/${createdMessage.id}`);
            const retrievedMessage = JSON.parse(getResponse.body);
            expect(retrievedMessage.message.isDeleted).toBe(true);
        });

        it("should return 404 when getting a non-existent message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a random UUID for a non-existent message
            const nonExistentMessageId = randomUUID();

            // Act
            const response = await auth.get(`/v1/messages/${nonExistentMessageId}`);

            // Assert
            expect(response.statusCode).toBe(404);

            const errorBody = JSON.parse(response.body);
            expect(errorBody.message).toContain(nonExistentMessageId);
        });

        it("should return 404 when updating a non-existent message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Generate a random UUID for a non-existent message
            const nonExistentMessageId = randomUUID();

            const updateData = {
                content: "Update for non-existent message",
            };

            // Act
            const response = await auth.put(`/v1/messages/${nonExistentMessageId}`, updateData);

            // Assert
            expect(response.statusCode).toBe(404);

            const errorBody = JSON.parse(response.body);
            expect(errorBody.message).toContain(nonExistentMessageId);
        });

        it("should return 403 when a user tries to update another user's message", async () => {
            // Arrange
            const server = getServer();
            const user1 = await authenticatedUser(server);
            const user2 = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Message Permission Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await user1.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Add user2 to the channel
            await user1.post(`/v1/channels/${channel.id}/members`, {
                userId: user2.user.id,
                role: "user",
            });

            // User1 creates a message
            const messageData = {
                content: "Message by user1",
            };
            const createMessageResponse = await user1.post(`/v1/channels/${channel.id}/messages`, messageData);
            const createdMessage = JSON.parse(createMessageResponse.body);

            // Update data
            const updateData = {
                content: "Attempted update by user2",
            };

            // Act - user2 tries to update user1's message
            const response = await user2.put(`/v1/messages/${createdMessage.id}`, updateData);

            // Assert
            expect(response.statusCode).toBe(403);

            // Verify message wasn't changed
            const getResponse = await user1.get(`/v1/messages/${createdMessage.id}`);
            const retrievedMessage = JSON.parse(getResponse.body);
            expect(retrievedMessage.message.content).toBe(messageData.content);
        });

        it("should create and retrieve threaded replies to a message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Thread Testing Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a parent message
            const parentMessageData = {
                content: "Parent message for thread testing",
            };
            const createParentResponse = await auth.post(`/v1/channels/${channel.id}/messages`, parentMessageData);
            const parentMessage = JSON.parse(createParentResponse.body);

            // Create reply messages
            const replyContents = [
                "First reply to thread",
                "Second reply to thread",
                "Third reply to thread",
            ];

            for (const content of replyContents) {
                await auth.post(`/v1/channels/${channel.id}/messages`, {
                    content,
                    parentMessageId: parentMessage.id,
                });
            }

            // Act - get replies to the parent message
            const response = await auth.get(`/v1/messages/${parentMessage.id}/replies`);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.data.length).toBe(3);

            // Verify the reply contents
            const replyTexts = result.data.map((msg: any) => msg.content);
            for (const content of replyContents) {
                expect(replyTexts).toContain(content);
            }

            // All replies should have the correct parentMessageId
            for (const reply of result.data) {
                expect(reply.parentMessageId).toBe(parentMessage.id);
            }
        });
    });

    describe("message reactions", () => {
        it("should add a reaction to a message", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Reaction Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Create a message
            const messageData = {
                content: "Message for reaction testing",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const message = JSON.parse(createMessageResponse.body);

            // Act - add a reaction
            const reactionData = {
                emoji: "👍",
            };
            const response = await auth.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.action).toBe("add");
            expect(result.reaction).toBeDefined();
            expect(result.reaction.emoji).toBe("👍");
            expect(result.reaction.userId).toBe(auth.user.id);
            expect(result.reaction.messageId).toBe(message.id);

            // Verify the reaction is included when getting the message
            const getMessageResponse = await auth.get(`/v1/messages/${message.id}`);
            const retrievedMessage = JSON.parse(getMessageResponse.body);

            expect(retrievedMessage.reactions.length).toBeGreaterThanOrEqual(1);

            const hasReaction = retrievedMessage.reactions.some(
                (r: any) => r.emoji === "👍" && r.userId === auth.user.id,
            );
            expect(hasReaction).toBe(true);
        });

        it("should toggle a reaction when added twice", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel and message
            const channelData = {
                name: `Toggle Reaction Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            const messageData = {
                content: "Message for reaction toggle testing",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const message = JSON.parse(createMessageResponse.body);

            // Add a reaction
            const reactionData = {
                emoji: "❤️",
            };
            await auth.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // Act - add the same reaction again (should toggle/remove it)
            const response = await auth.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.action).toBe("remove");
            expect(result.reaction).toBeNull();

            // Verify the reaction is removed
            const getMessageResponse = await auth.get(`/v1/messages/${message.id}`);
            const retrievedMessage = JSON.parse(getMessageResponse.body);

            const hasReaction = retrievedMessage.reactions.some(
                (r: any) => r.emoji === "❤️" && r.userId === auth.user.id,
            );
            expect(hasReaction).toBe(false);
        });

        it("should allow different users to react with the same emoji", async () => {
            // Arrange
            const server = getServer();
            const user1 = await authenticatedUser(server);
            const user2 = await authenticatedUser(server);

            // Create a channel
            const channelData = {
                name: `Multi-User Reaction Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await user1.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Add user2 to the channel
            await user1.post(`/v1/channels/${channel.id}/members`, {
                userId: user2.user.id,
                role: "user",
            });

            // Create a message
            const messageData = {
                content: "Message for multi-user reaction testing",
            };
            const createMessageResponse = await user1.post(`/v1/channels/${channel.id}/messages`, messageData);
            const message = JSON.parse(createMessageResponse.body);

            // Both users add the same reaction
            const reactionData = {
                emoji: "🎉",
            };

            // User 1 adds reaction
            await user1.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // User 2 adds the same reaction
            const user2Response = await user2.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // Assert
            expect(user2Response.statusCode).toBe(200);

            // Verify both reactions are recorded
            const getMessageResponse = await user1.get(`/v1/messages/${message.id}`);
            const retrievedMessage = JSON.parse(getMessageResponse.body);

            const reactionsWithEmoji = retrievedMessage.reactions.filter(
                (r: any) => r.emoji === "🎉",
            );
            expect(reactionsWithEmoji.length).toBe(2);

            const user1HasReaction = reactionsWithEmoji.some((r: any) => r.userId === user1.user.id);
            const user2HasReaction = reactionsWithEmoji.some((r: any) => r.userId === user2.user.id);

            expect(user1HasReaction).toBe(true);
            expect(user2HasReaction).toBe(true);
        });

        it("should remove a reaction using the delete endpoint", async () => {
            // Arrange
            const server = getServer();
            const auth = await authenticatedUser(server);

            // Create a channel and message
            const channelData = {
                name: `Delete Reaction Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await auth.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            const messageData = {
                content: "Message for reaction deletion testing",
            };
            const createMessageResponse = await auth.post(`/v1/channels/${channel.id}/messages`, messageData);
            const message = JSON.parse(createMessageResponse.body);

            // Add a reaction
            const emoji = "🚀";
            const reactionData = { emoji };
            await auth.post(`/v1/messages/${message.id}/reactions`, reactionData);

            // Act - delete the reaction
            const response = await auth.delete(`/v1/messages/${message.id}/reactions/${encodeURIComponent(emoji)}`);

            // Assert
            expect(response.statusCode).toBe(204);

            // Verify the reaction is removed
            const getMessageResponse = await auth.get(`/v1/messages/${message.id}`);
            const retrievedMessage = JSON.parse(getMessageResponse.body);

            const hasReaction = retrievedMessage.reactions.some(
                (r: any) => r.emoji === emoji && r.userId === auth.user.id,
            );
            expect(hasReaction).toBe(false);
        });
    });

    describe("user mentions", () => {
        it("should get messages where the user is mentioned", async () => {
            // Arrange
            const server = getServer();
            const mentioningUser = await authenticatedUser(server);
            const mentionedUser = await authenticatedUser(server);

            console.log("DEBUG - Mentioned user:", {
                id: mentionedUser.user.id,
                username: mentionedUser.user.username,
            });

            // Create a channel
            const channelData = {
                name: `Mention Channel ${randomUUID().substring(0, 8)}`,
            };
            const createChannelResponse = await mentioningUser.post("/v1/channels", channelData);
            const channel = JSON.parse(createChannelResponse.body);

            // Add the mentioned user to the channel
            await mentioningUser.post(`/v1/channels/${channel.id}/members`, {
                userId: mentionedUser.user.id,
                role: "user",
            });

            // Mentioning user creates a message that mentions the other user
            const messageData = {
                content: `Hey @${mentionedUser.user.username} this is a test mention!`,
            };
            await mentioningUser.post(`/v1/channels/${channel.id}/messages`, messageData);

            // Act - mentioned user checks their mentions
            const response = await mentionedUser.get(`/v1/users/me/mentions`);

            // Assert
            expect(response.statusCode).toBe(200);

            const result = JSON.parse(response.body);
            expect(result.data.length).toBeGreaterThanOrEqual(1);

            console.log("DEBUG - Mention results:", {
                expected: `@${mentionedUser.user.username}`,
                messages: result.data.map((msg: any) => msg.content),
            });

            // At least one message should contain the mention text
            const hasMention = result.data.some(
                (msg: any) => msg.content.includes(`@${mentionedUser.user.username}`),
            );
            expect(hasMention).toBe(true);
        });
    });
});
