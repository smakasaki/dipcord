import { eq, lt } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";
import type { CreateSessionData, Session } from "#users/app/models.js";
import type { ISessionRepository } from "#users/app/session-repo.js";

import { sessions } from "#db/schema/index.js";

/**
 * Session Data Access Object
 * Implements ISessionRepository interface using Drizzle ORM
 */
export class SessionDao implements ISessionRepository {
    /**
     * Create a new SessionDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new session
     * @param data Session data
     * @returns Created session
     */
    async create(data: CreateSessionData): Promise<Session> {
        const result = await this.db
            .insert(sessions)
            .values({
                userId: data.userId,
                token: data.token,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                expiresAt: data.expiresAt,
            })
            .returning();

        if (!result[0]) {
            throw new Error("Failed to create session");
        }

        // Map database entity to domain entity
        return this.mapToDomainSession(result[0]);
    }

    /**
     * Find session by token
     * @param token Session token
     * @returns Session or undefined if not found
     */
    async findByToken(token: string): Promise<Session | undefined> {
        const result = await this.db
            .select()
            .from(sessions)
            .where(eq(sessions.token, token))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainSession(result[0]);
    }

    /**
     * Find session by ID
     * @param id Session ID
     * @returns Session or undefined if not found
     */
    async findById(id: string): Promise<Session | undefined> {
        const result = await this.db
            .select()
            .from(sessions)
            .where(eq(sessions.id, id))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainSession(result[0]);
    }

    /**
     * Find all sessions for a user
     * @param userId User ID
     * @returns Array of sessions
     */
    async findByUserId(userId: string): Promise<Session[]> {
        const result = await this.db
            .select()
            .from(sessions)
            .where(eq(sessions.userId, userId));

        return result.map(session => this.mapToDomainSession(session));
    }

    /**
     * Update the last used timestamp for a session
     * @param id Session ID
     * @returns Updated session
     */
    async updateLastUsed(id: string): Promise<Session | undefined> {
        const result = await this.db
            .update(sessions)
            .set({
                lastUsedAt: new Date(),
            })
            .where(eq(sessions.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainSession(result[0]);
    }

    /**
     * Delete a session
     * @param id Session ID
     * @returns Deleted session or undefined if not found
     */
    async delete(id: string): Promise<Session | undefined> {
        const result = await this.db
            .delete(sessions)
            .where(eq(sessions.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainSession(result[0]);
    }

    /**
     * Delete all sessions for a user
     * @param userId User ID
     * @returns Number of deleted sessions
     */
    async deleteByUserId(userId: string): Promise<number> {
        const result = await this.db
            .delete(sessions)
            .where(eq(sessions.userId, userId))
            .returning({ id: sessions.id });

        return result.length;
    }

    /**
     * Delete expired sessions
     * @returns Number of deleted sessions
     */
    async deleteExpired(): Promise<number> {
        const now = new Date();

        const result = await this.db
            .delete(sessions)
            .where(lt(sessions.expiresAt, now))
            .returning({ id: sessions.id });

        return result.length;
    }

    /**
     * Map database session entity to domain session entity
     * @param session Database session entity
     * @returns Domain session entity
     */
    private mapToDomainSession(session: typeof sessions.$inferSelect): Session {
        return {
            id: session.id,
            userId: session.userId,
            token: session.token,
            ipAddress: session.ipAddress || undefined,
            userAgent: session.userAgent || undefined,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
        };
    }
}
