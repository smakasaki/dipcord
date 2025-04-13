import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { ChannelIdParam, EmojiParam, GetChannelMessagesSchema, MessageIdParam, MessageReactionResponseSchema, MessageResponseSchema, MessagesResponseSchema, MessageWithDetailsResponseSchema, SendMessageSchema, ToggleReactionSchema, UpdateMessageSchema } from "@dipcord/schema";
import { StandardErrorResponses } from "@dipcord/schema/common";
import { z } from "zod";

/**
 * Message routes for the chat API
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    /**
     * Create a new message in a channel
     */
    fastify.post("/channels/:channelId/messages", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Create a new message in a channel",
            params: ChannelIdParam,
            body: SendMessageSchema,
            response: {
                201: MessageResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { channelId } = request.params;
        const userId = request.user!.id;

        const result = await fastify.chatService.sendMessage({
            userId,
            channelId,
            content: request.body.content,
            parentMessageId: request.body.parentMessageId,
            attachments: request.body.attachments,
        });

        return reply.status(201).send({
            ...result.message,
            createdAt: result.message.createdAt.toISOString(),
            updatedAt: result.message.updatedAt.toISOString(),
            attachments: result.attachments.map(att => ({
                ...att,
                createdAt: att.createdAt.toISOString(),
            })),
        });
    });

    /**
     * Get messages from a channel
     */
    fastify.get("/channels/:channelId/messages", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Get messages from a channel with pagination",
            params: ChannelIdParam,
            querystring: GetChannelMessagesSchema.omit({ channelId: true }),
            response: {
                200: MessagesResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { channelId } = request.params;
        const { limit, cursor, sort, parentMessageId, includeDeleted } = request.query;
        const userId = request.user!.id;

        const result = await fastify.chatService.getChannelMessages({
            userId,
            channelId,
            limit,
            cursor,
            sort,
            parentMessageId,
            includeDeleted,
        });

        // Format dates for the response
        const formattedMessages = result.messages.map((message) => {
            const msgAttachments = result.attachments[message.id] || [];
            const msgReactions = result.reactions[message.id] || [];

            return {
                ...message,
                createdAt: message.createdAt.toISOString(),
                updatedAt: message.updatedAt.toISOString(),
                attachments: msgAttachments.map(att => ({
                    ...att,
                    createdAt: att.createdAt.toISOString(),
                })),
                reactions: msgReactions.map(reaction => ({
                    ...reaction,
                    createdAt: reaction.createdAt.toISOString(),
                })),
            };
        });

        // Store nextCursor in a header if it exists
        if (result.nextCursor) {
            reply.header("X-Next-Cursor", result.nextCursor);
        }

        return reply.send({
            data: formattedMessages,
            count: formattedMessages.length,
        });
    });

    /**
     * Get message replies
     */
    fastify.get("/messages/:messageId/replies", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Get replies to a message",
            params: MessageIdParam,
            querystring: GetChannelMessagesSchema.omit({ channelId: true, parentMessageId: true }),
            response: {
                200: MessagesResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId } = request.params;
        const { limit, cursor, sort, includeDeleted } = request.query;
        const userId = request.user!.id;

        // Get the channel ID for the message
        const messageDetails = await fastify.chatService.getMessageById({
            messageId,
            userId,
        });

        if (!messageDetails || !messageDetails.message) {
            throw new Error("Message not found");
        }

        const result = await fastify.chatService.getChannelMessages({
            userId,
            channelId: messageDetails.message.channelId,
            limit,
            cursor,
            sort,
            parentMessageId: messageId,
            includeDeleted,
        });

        // Format dates for the response (same as above)
        const formattedMessages = result.messages.map((message) => {
            const msgAttachments = result.attachments[message.id] || [];
            const msgReactions = result.reactions[message.id] || [];

            return {
                ...message,
                createdAt: message.createdAt.toISOString(),
                updatedAt: message.updatedAt.toISOString(),
                attachments: msgAttachments.map(att => ({
                    ...att,
                    createdAt: att.createdAt.toISOString(),
                })),
                reactions: msgReactions.map(reaction => ({
                    ...reaction,
                    createdAt: reaction.createdAt.toISOString(),
                })),
            };
        });

        // Store nextCursor in a header if it exists
        if (result.nextCursor) {
            reply.header("X-Next-Cursor", result.nextCursor);
        }

        return reply.send({
            data: formattedMessages,
            count: formattedMessages.length,
        });
    });

    /**
     * Get message by ID
     */
    fastify.get("/messages/:messageId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Get a message by ID with all details",
            params: MessageIdParam,
            response: {
                200: MessageWithDetailsResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId } = request.params;
        const userId = request.user!.id;

        const result = await fastify.chatService.getMessageById({
            messageId,
            userId,
        });

        // Format the message for response
        return reply.send({
            message: {
                ...result.message,
                createdAt: result.message.createdAt.toISOString(),
                updatedAt: result.message.updatedAt.toISOString(),
            },
            attachments: result.attachments.map(att => ({
                ...att,
                createdAt: att.createdAt.toISOString(),
            })),
            reactions: result.reactions.map(reaction => ({
                ...reaction,
                createdAt: reaction.createdAt.toISOString(),
            })),
        });
    });

    /**
     * Update a message
     */
    fastify.put("/messages/:messageId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Update a message content",
            params: MessageIdParam,
            body: UpdateMessageSchema.omit({ messageId: true }),
            response: {
                200: MessageResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId } = request.params;
        const { content } = request.body;
        const userId = request.user!.id;

        const result = await fastify.chatService.updateMessage({
            userId,
            messageId,
            content,
        });

        return reply.send({
            ...result,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        });
    });

    /**
     * Delete a message
     */
    fastify.delete("/messages/:messageId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Delete a message (soft delete)",
            params: MessageIdParam,
            response: {
                200: MessageResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId } = request.params;
        const userId = request.user!.id;

        const result = await fastify.chatService.deleteMessage({
            userId,
            messageId,
        });

        return reply.send({
            ...result,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        });
    });

    /**
     * Add/toggle a reaction to a message
     */
    fastify.post("/messages/:messageId/reactions", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Add or toggle a reaction on a message",
            params: MessageIdParam,
            body: ToggleReactionSchema.omit({ messageId: true }),
            response: {
                200: z.object({
                    action: z.enum(["add", "remove"]),
                    reaction: MessageReactionResponseSchema.nullable(),
                }),
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId } = request.params;
        const { emoji } = request.body;
        const userId = request.user!.id;

        const result = await fastify.chatService.toggleReaction({
            userId,
            messageId,
            emoji,
        });

        return reply.send({
            action: result.action,
            reaction: result.reaction
                ? {
                        ...result.reaction,
                        createdAt: result.reaction.createdAt.toISOString(),
                    }
                : null,
        });
    });

    /**
     * Remove a reaction from a message
     */
    fastify.delete("/messages/:messageId/reactions/:emoji", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Remove a specific reaction from a message",
            params: MessageIdParam.merge(EmojiParam),
            response: {
                204: z.object({}),
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { messageId, emoji } = request.params;
        const userId = request.user!.id;

        await fastify.chatService.toggleReaction({
            userId,
            messageId,
            emoji: decodeURIComponent(emoji), // Make sure to decode the emoji from URL
        });

        return reply.status(204).send({});
    });

    /**
     * Get user mentions
     */
    fastify.get("/users/me/mentions", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Messages"],
            description: "Get messages where the current user is mentioned",
            querystring: z.object({
                limit: z.number().optional().default(20),
                cursor: z.string().optional(),
            }),
            response: {
                200: MessagesResponseSchema,
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const userId = request.user!.id;
        const { limit, cursor } = request.query as { limit?: number; cursor?: string };

        // Use our new user mentions use case
        const result = await fastify.chatService.getUserMentions({
            userId,
            limit,
            cursor,
        });

        // Format the response
        const formattedMessages = result.messages.map(message => ({
            ...message,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
        }));

        // Store nextCursor in a header if it exists
        if (result.nextCursor) {
            reply.header("X-Next-Cursor", result.nextCursor);
        }

        return reply.send({
            data: formattedMessages,
            count: formattedMessages.length,
        });
    });
};

export default routes;
