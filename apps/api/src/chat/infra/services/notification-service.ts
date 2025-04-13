// src/chat/infra/services/notification-service.ts

import type { Message, MessageAttachment, MessageReaction } from "@dipcord/domain";
import type { FastifyInstance } from "fastify";

import { eq } from "drizzle-orm";

import { messages } from "#db/schema/index.js";

import type { NotificationService } from "../../app/ports/outgoing.js";

export class WebSocketNotificationService implements NotificationService {
    constructor(private readonly fastify: FastifyInstance) {}

    async notifyMessageCreated(message: Message, attachments: MessageAttachment[]): Promise<void> {
        try {
            this.fastify.broadcastToChannel(message.channelId, "message:created", {
                messageId: message.id,
                channelId: message.channelId,
                userId: message.userId,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                parentMessageId: message.parentMessageId,
                attachments: attachments.map(att => ({
                    id: att.id,
                    fileName: att.fileName,
                    fileType: att.fileType,
                    size: att.size,
                    s3Location: att.s3Location,
                })),
            });
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify message created");
        }
    }

    async notifyMessageUpdated(message: Message): Promise<void> {
        try {
            this.fastify.broadcastToChannel(message.channelId, "message:updated", {
                messageId: message.id,
                channelId: message.channelId,
                content: message.content as string,
                updatedAt: message.updatedAt.toISOString(),
                isEdited: message.isEdited,
            });
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify message updated");
        }
    }

    async notifyMessageDeleted(message: Message): Promise<void> {
        try {
            this.fastify.broadcastToChannel(message.channelId, "message:deleted", {
                messageId: message.id,
                channelId: message.channelId,
            });
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify message deleted");
        }
    }

    async notifyReactionToggled(
        reaction: MessageReaction | null,
        action: "add" | "remove",
    ): Promise<void> {
        try {
            if (reaction) {
                // Use DAO to retrieve the message
                const message = await this.fastify.db
                    .select()
                    .from(messages)
                    .where(eq(messages.id, reaction.messageId))
                    .limit(1)
                    .then(res => res[0]);

                if (message) {
                    this.fastify.broadcastToChannel(message.channelId, "message:reaction", {
                        messageId: reaction.messageId,
                        userId: reaction.userId,
                        emoji: reaction.emoji,
                        action,
                    });
                }
            }
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify reaction toggled");
        }
    }
}
