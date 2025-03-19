import type { CreatePasswordResetTokenData, PasswordResetToken } from "./models.js";

/**
 * Password Reset Token Repository Interface
 * Defines operations for password reset token management
 */
export type IPasswordResetTokenRepository = {
    /**
     * Create a new password reset token
     * @param data Token data
     * @returns Created token
     */
    create: (data: CreatePasswordResetTokenData) => Promise<PasswordResetToken>;

    /**
     * Find token by value
     * @param token Token value
     * @returns Token or undefined if not found
     */
    findByToken: (token: string) => Promise<PasswordResetToken | undefined>;

    /**
     * Find active token by user ID
     * @param userId User ID
     * @returns Token or undefined if not found
     */
    findActiveByUserId: (userId: string) => Promise<PasswordResetToken | undefined>;

    /**
     * Mark token as used
     * @param id Token ID
     * @returns Updated token or undefined if not found
     */
    markAsUsed: (id: string) => Promise<PasswordResetToken | undefined>;

    /**
     * Delete token
     * @param id Token ID
     * @returns Deleted token or undefined if not found
     */
    delete: (id: string) => Promise<PasswordResetToken | undefined>;

    /**
     * Delete all tokens for a user
     * @param userId User ID
     * @returns Number of deleted tokens
     */
    deleteByUserId: (userId: string) => Promise<number>;

    /**
     * Delete expired tokens
     * @returns Number of deleted tokens
     */
    deleteExpired: () => Promise<number>;
};
