// src/chat/infra/plugins/chat-service.ts

import type { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";

import { createChatService } from "#chat/app/chat-service.js";

import { AttachmentDao } from "../dao/attachment-dao.js";
import { ChannelMemberDao } from "../dao/channel-member-dao.js";
import { MentionDao } from "../dao/mention-dao.js";
import { MessageDao } from "../dao/message-dao.js";
import { ReactionDao } from "../dao/reaction-dao.js";
import { WebSocketNotificationService } from "../services/notification-service.js";
import { uploadToS3 } from "../services/s3-service.js";
import { UserMentionExtractor } from "../utils/mention-extractor.js";

/**
 * Chat services plugin for Fastify
 *
 * This plugin registers the chat service and all its dependencies
 */
const chatServicePlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.db) {
        throw new Error("Database not found. Make sure it is registered before the chat service plugin.");
    }

    // Create repositories
    const messageRepository = new MessageDao(fastify.db);
    const attachmentRepository = new AttachmentDao(fastify.db);
    const reactionRepository = new ReactionDao(fastify.db);
    const mentionRepository = new MentionDao(fastify.db);
    const channelMemberRepository = new ChannelMemberDao(fastify.db);

    // Create utilities and services
    const mentionExtractor = new UserMentionExtractor();
    const notificationService = new WebSocketNotificationService(fastify);

    // Create chat service
    const chatService = createChatService({
        messageRepository,
        attachmentRepository,
        reactionRepository,
        mentionRepository,
        mentionExtractor,
        channelMemberRepository,
        notificationService,
        s3Service: { uploadToS3 },
    });

    // Register the chat service
    fastify.decorate("chatService", chatService);

    fastify.log.info("Chat service registered");
};

export default fp(chatServicePlugin, {
    name: "chat-service",
    dependencies: ["database", "websocket", "user-services", "channel-services"],
});
