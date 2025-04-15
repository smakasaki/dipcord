import type { Message, MessagePaginationParams } from "@dipcord/domain";

import { and, asc, desc, eq, gt, isNull, lt, or } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";

import { messages } from "#db/schema/index.js";

import type { MessageRepository } from "../../app/ports/outgoing.js";

/**
 * Message Data Access Object
 * Implements MessageRepository interface using Drizzle ORM
 */
export class MessageDao implements MessageRepository {
    /**
     * Create a new MessageDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new message
     * @param message Message data
     * @returns Created message
     */
    async createMessage(message: Omit<Message, "id" | "createdAt" | "updatedAt" | "isEdited">): Promise<Message> {
        const result = await this.db
            .insert(messages)
            .values({
                channelId: message.channelId,
                userId: message.userId,
                content: message.content,
                parentMessageId: message.parentMessageId,
                isDeleted: message.isDeleted || false,
            })
            .returning();

        if (!result[0]) {
            throw new Error("Message not created");
        }

        return this.mapToDomainMessage(result[0]);
    }

    /**
     * Get message by id
     * @param id Message id
     * @returns Message or null if not found
     */
    async getMessage(id: string): Promise<Message | null> {
        const result = await this.db
            .select()
            .from(messages)
            .where(eq(messages.id, id))
            .limit(1);

        if (!result[0]) {
            return null;
        }

        return this.mapToDomainMessage(result[0]);
    }

    /**
     * Update message content
     * @param id Message id
     * @param content New message content
     * @returns Updated message
     */
    async updateMessage(id: string, content: string): Promise<Message> {
        const result = await this.db
            .update(messages)
            .set({
                content,
                updatedAt: new Date(),
                isEdited: true,
            })
            .where(eq(messages.id, id))
            .returning();

        if (!result[0]) {
            throw new Error("Message not found");
        }

        return this.mapToDomainMessage(result[0]);
    }

    /**
     * Delete message (soft delete)
     * @param id Message id
     * @returns Deleted message
     */
    async deleteMessage(id: string): Promise<Message> {
        const result = await this.db
            .update(messages)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
            })
            .where(eq(messages.id, id))
            .returning();

        if (!result[0]) {
            throw new Error("Message not found");
        }

        return this.mapToDomainMessage(result[0]);
    }

    /**
     * Get messages with cursor-based pagination
     * @param params Pagination parameters
     * @returns Paginated messages with next cursor
     */
    async getMessages(params: MessagePaginationParams): Promise<{
        data: Message[];
        nextCursor: string | null;
    }> {
        const { limit, cursor, sort, filters } = params;
        const sortDirection = sort === "oldest" ? asc : desc;

        // Build where conditions
        const conditions = [
            eq(messages.channelId, filters.channelId),
        ];

        // Handle parent message ID filtering
        if (filters.parentMessageId === null) {
            conditions.push(isNull(messages.parentMessageId));
        }
        else if (filters.parentMessageId !== undefined) {
            conditions.push(eq(messages.parentMessageId, filters.parentMessageId));
        }

        // Handle deleted messages filtering
        if (!filters.includeDeleted) {
            conditions.push(eq(messages.isDeleted, false));
        }

        // Start query with base conditions
        let query = this.db
            .select()
            .from(messages)
            .where(and(...conditions));

        // Apply cursor-based pagination
        if (cursor) {
            const cursorObj = JSON.parse(cursor);
            const createdAt = new Date(cursorObj.createdAt);
            const id = cursorObj.id;

            // Add cursor condition based on sort direction
            const cursorCondition = sort === "oldest"
                ? or(
                        gt(messages.createdAt, createdAt),
                        and(
                            eq(messages.createdAt, createdAt),
                            gt(messages.id, id),
                        ),
                    )
                : or(
                        lt(messages.createdAt, createdAt),
                        and(
                            eq(messages.createdAt, createdAt),
                            lt(messages.id, id),
                        ),
                    );

            // Create a new query with the cursor condition added
            query = this.db
                .select()
                .from(messages)
                .where(and(...conditions, cursorCondition));
        }

        // Add order and limit
        const result = await query
            .orderBy(sortDirection(messages.createdAt), sortDirection(messages.id))
            .limit(limit + 1); // Get one extra item to determine if there are more results

        const hasMore = result.length > limit;
        const data = hasMore ? result.slice(0, limit) : result;

        // Create next cursor if there are more results
        let nextCursor: string | null = null;
        if (hasMore && data.length > 0) {
            const lastItem = data[data.length - 1];
            if (lastItem) {
                nextCursor = JSON.stringify({
                    id: lastItem.id,
                    createdAt: lastItem.createdAt.toISOString(),
                });
            }
        }

        return {
            data: data.map(item => this.mapToDomainMessage(item)),
            nextCursor,
        };
    }

    /**
     * Map database message entity to domain message entity
     * @param message Database message entity
     * @returns Domain message entity
     */
    private mapToDomainMessage(message: typeof messages.$inferSelect): Message {
        return {
            id: message.id,
            channelId: message.channelId,
            userId: message.userId,
            content: message.content,
            parentMessageId: message.parentMessageId,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            isEdited: message.isEdited,
            isDeleted: message.isDeleted,
        };
    }
}
