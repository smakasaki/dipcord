import type { MessageMention } from "@dipcord/domain";

import { eq, inArray } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";

import { messageMentions } from "#db/schema/index.js";

import type { MentionRepository } from "../../app/ports/outgoing.js";

/**
 * Mention Data Access Object
 * Implements MentionRepository interface using Drizzle ORM
 */
export class MentionDao implements MentionRepository {
    /**
     * Create a new MentionDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create multiple message mentions
     * @param mentions Array of mention data
     * @returns Created mentions
     */
    async createMentions(mentions: Array<Omit<MessageMention, "id" | "createdAt">>): Promise<MessageMention[]> {
        if (mentions.length === 0) {
            return [];
        }

        const result = await this.db
            .insert(messageMentions)
            .values(
                mentions.map(mention => ({
                    messageId: mention.messageId,
                    mentionedUserId: mention.mentionedUserId,
                })),
            )
            .returning();

        return result.map(mention => this.mapToDomainMention(mention));
    }

    /**
     * Get mentions for a message
     * @param messageId Message ID
     * @returns Mentions for the message
     */
    async getMentionsByMessageId(messageId: string): Promise<MessageMention[]> {
        const result = await this.db
            .select()
            .from(messageMentions)
            .where(eq(messageMentions.messageId, messageId));

        return result.map(mention => this.mapToDomainMention(mention));
    }

    /**
     * Get mentions for multiple messages
     * @param messageIds Array of message IDs
     * @returns Record of message ID to mentions array
     */
    async getMentionsByMessageIds(messageIds: string[]): Promise<Record<string, MessageMention[]>> {
        if (messageIds.length === 0) {
            return {};
        }

        const result = await this.db
            .select()
            .from(messageMentions)
            .where(inArray(messageMentions.messageId, messageIds));

        // Group mentions by message ID
        return result.reduce<Record<string, MessageMention[]>>((acc, mention) => {
            const messageId = mention.messageId;
            if (!acc[messageId]) {
                acc[messageId] = [];
            }
            acc[messageId].push(this.mapToDomainMention(mention));
            return acc;
        }, {});
    }

    /**
     * Map database mention entity to domain mention entity
     * @param mention Database mention entity
     * @returns Domain mention entity
     */
    private mapToDomainMention(mention: typeof messageMentions.$inferSelect): MessageMention {
        return {
            id: mention.id,
            messageId: mention.messageId,
            mentionedUserId: mention.mentionedUserId,
            createdAt: mention.createdAt,
        };
    }
}
