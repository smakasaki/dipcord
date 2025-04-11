import type { MessageReaction } from "@dipcord/domain";

import { and, eq, inArray } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";

import { messageReactions } from "#db/schema/index.js";

import type { ReactionRepository } from "../../app/ports/outgoing.js";

/**
 * Reaction Data Access Object
 * Implements ReactionRepository interface using Drizzle ORM
 */
export class ReactionDao implements ReactionRepository {
    /**
     * Create a new ReactionDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a message reaction
     * @param reaction Reaction data
     * @returns Created reaction
     */
    async createReaction(reaction: Omit<MessageReaction, "id" | "createdAt">): Promise<MessageReaction> {
        const result = await this.db
            .insert(messageReactions)
            .values({
                messageId: reaction.messageId,
                userId: reaction.userId,
                emoji: reaction.emoji,
            })
            .returning();

        if (!result[0]) {
            throw new Error("Reaction not created");
        }

        return this.mapToDomainReaction(result[0]);
    }

    /**
     * Delete a message reaction
     * @param messageId Message ID
     * @param userId User ID
     * @param emoji Emoji code
     */
    async deleteReaction(messageId: string, userId: string, emoji: string): Promise<void> {
        await this.db
            .delete(messageReactions)
            .where(
                and(
                    eq(messageReactions.messageId, messageId),
                    eq(messageReactions.userId, userId),
                    eq(messageReactions.emoji, emoji),
                ),
            );
    }

    /**
     * Get reactions for a message
     * @param messageId Message ID
     * @returns Reactions for the message
     */
    async getReactionsByMessageId(messageId: string): Promise<MessageReaction[]> {
        const result = await this.db
            .select()
            .from(messageReactions)
            .where(eq(messageReactions.messageId, messageId));

        return result.map(reaction => this.mapToDomainReaction(reaction));
    }

    /**
     * Get reactions for multiple messages
     * @param messageIds Array of message IDs
     * @returns Record of message ID to reactions array
     */
    async getReactionsByMessageIds(messageIds: string[]): Promise<Record<string, MessageReaction[]>> {
        if (messageIds.length === 0) {
            return {};
        }

        const result = await this.db
            .select()
            .from(messageReactions)
            .where(inArray(messageReactions.messageId, messageIds));

        // Group reactions by message ID
        return result.reduce<Record<string, MessageReaction[]>>((acc, reaction) => {
            const messageId = reaction.messageId;
            if (!acc[messageId]) {
                acc[messageId] = [];
            }
            acc[messageId].push(this.mapToDomainReaction(reaction));
            return acc;
        }, {});
    }

    /**
     * Map database reaction entity to domain reaction entity
     * @param reaction Database reaction entity
     * @returns Domain reaction entity
     */
    private mapToDomainReaction(reaction: typeof messageReactions.$inferSelect): MessageReaction {
        return {
            id: reaction.id,
            messageId: reaction.messageId,
            userId: reaction.userId,
            emoji: reaction.emoji,
            createdAt: reaction.createdAt,
        };
    }
}
