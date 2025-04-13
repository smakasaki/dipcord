import type { MessageAttachment } from "@dipcord/domain";

import { eq } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";

import { messageAttachments } from "#db/schema/index.js";

import type { AttachmentRepository } from "../../app/ports/outgoing.js";

/**
 * Attachment Data Access Object
 * Implements AttachmentRepository interface using Drizzle ORM
 */
export class AttachmentDao implements AttachmentRepository {
    /**
     * Create a new AttachmentDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create multiple message attachments
     * @param attachments Array of attachment data
     * @returns Created attachments
     */
    async createAttachments(attachments: Array<Omit<MessageAttachment, "id" | "createdAt">>): Promise<MessageAttachment[]> {
        if (attachments.length === 0) {
            return [];
        }

        const result = await this.db
            .insert(messageAttachments)
            .values(
                attachments.map(attachment => ({
                    messageId: attachment.messageId,
                    fileName: attachment.fileName,
                    fileType: attachment.fileType,
                    size: attachment.size,
                    s3Location: attachment.s3Location,
                })),
            )
            .returning();

        return result.map(attachment => this.mapToDomainAttachment(attachment));
    }

    /**
     * Get attachments by message ID
     * @param messageId Message ID
     * @returns Attachments for the message
     */
    async getAttachmentsByMessageId(messageId: string): Promise<MessageAttachment[]> {
        const result = await this.db
            .select()
            .from(messageAttachments)
            .where(eq(messageAttachments.messageId, messageId));

        return result.map(attachment => this.mapToDomainAttachment(attachment));
    }

    /**
     * Get attachment by its ID
     * @param attachmentId Attachment ID
     * @returns The attachment or null if not found
     */
    async getAttachmentById(attachmentId: string): Promise<MessageAttachment | null> {
        const result = await this.db
            .select()
            .from(messageAttachments)
            .where(eq(messageAttachments.id, attachmentId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        // Because we limit to 1, we know it's a valid attachment record
        // TypeScript doesn't always understand this, so we'll be explicit
        return this.mapToDomainAttachment(result[0] as typeof messageAttachments.$inferSelect);
    }

    /**
     * Map database attachment entity to domain attachment entity
     * @param attachment Database attachment entity
     * @returns Domain attachment entity
     */
    private mapToDomainAttachment(attachment: typeof messageAttachments.$inferSelect): MessageAttachment {
        return {
            id: attachment.id,
            messageId: attachment.messageId,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            size: attachment.size,
            s3Location: attachment.s3Location,
            createdAt: attachment.createdAt,
        };
    }
}
