import { and, eq, gt, isNull, lt } from "drizzle-orm";

import type { Database } from "#commons/infra/plugins/database.js";
import type { CreatePasswordResetTokenData, PasswordResetToken } from "#users/app/models.js";
import type { IPasswordResetTokenRepository } from "#users/app/password-reset-repo.js";

import { passwordResetTokens } from "#db/schema/index.js";

/**
 * Password Reset Token Data Access Object
 * Implements IPasswordResetTokenRepository interface using Drizzle ORM
 */
export class PasswordResetTokenDao implements IPasswordResetTokenRepository {
    /**
     * Create a new PasswordResetTokenDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new password reset token
     * @param data Token data
     * @returns Created token
     */
    async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
        const result = await this.db
            .insert(passwordResetTokens)
            .values({
                userId: data.userId,
                token: data.token,
                expiresAt: data.expiresAt,
            })
            .returning();

        if (!result[0]) {
            throw new Error("Failed to create password reset token");
        }

        return this.mapToDomainToken(result[0]);
    }

    /**
     * Find token by value
     * @param token Token value
     * @returns Token or undefined if not found
     */
    async findByToken(token: string): Promise<PasswordResetToken | undefined> {
        const result = await this.db
            .select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainToken(result[0]);
    }

    /**
     * Find active token by user ID
     * @param userId User ID
     * @returns Token or undefined if not found
     */
    async findActiveByUserId(userId: string): Promise<PasswordResetToken | undefined> {
        const now = new Date();
        const result = await this.db
            .select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.userId, userId),
                    isNull(passwordResetTokens.usedAt),
                    gt(passwordResetTokens.expiresAt, now),
                ),
            )
            .orderBy(passwordResetTokens.createdAt)
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainToken(result[0]);
    }

    /**
     * Mark token as used
     * @param id Token ID
     * @returns Updated token or undefined if not found
     */
    async markAsUsed(id: string): Promise<PasswordResetToken | undefined> {
        const result = await this.db
            .update(passwordResetTokens)
            .set({
                usedAt: new Date(),
            })
            .where(eq(passwordResetTokens.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainToken(result[0]);
    }

    /**
     * Delete token
     * @param id Token ID
     * @returns Deleted token or undefined if not found
     */
    async delete(id: string): Promise<PasswordResetToken | undefined> {
        const result = await this.db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.id, id))
            .returning();

        if (!result[0]) {
            return undefined;
        }

        return this.mapToDomainToken(result[0]);
    }

    /**
     * Delete all tokens for a user
     * @param userId User ID
     * @returns Number of deleted tokens
     */
    async deleteByUserId(userId: string): Promise<number> {
        const result = await this.db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.userId, userId))
            .returning({ id: passwordResetTokens.id });

        return result.length;
    }

    /**
     * Delete expired tokens
     * @returns Number of deleted tokens
     */
    async deleteExpired(): Promise<number> {
        const now = new Date();

        const result = await this.db
            .delete(passwordResetTokens)
            .where(lt(passwordResetTokens.expiresAt, now))
            .returning({ id: passwordResetTokens.id });

        return result.length;
    }

    /**
     * Map database token entity to domain token entity
     * @param token Database token entity
     * @returns Domain token entity
     */
    private mapToDomainToken(token: typeof passwordResetTokens.$inferSelect): PasswordResetToken {
        return {
            id: token.id,
            userId: token.userId,
            token: token.token,
            expiresAt: token.expiresAt,
            createdAt: token.createdAt,
            usedAt: token.usedAt || null,
        };
    }
}
