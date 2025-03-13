import type { CreateSessionData, Session } from "./models.js";

/**
 * Session Repository Interface
 * Defines operations for session management
 */
export type ISessionRepository = {
    /**
     * Create a new session
     * @param data Session data
     * @returns Created session
     */
    create: (data: CreateSessionData) => Promise<Session>;

    /**
     * Find session by token
     * @param token Session token
     * @returns Session or undefined if not found
     */
    findByToken: (token: string) => Promise<Session | undefined>;

    /**
     * Find session by ID
     * @param id Session ID
     * @returns Session or undefined if not found
     */
    findById: (id: string) => Promise<Session | undefined>;

    /**
     * Find all sessions for a user
     * @param userId User ID
     * @returns Array of sessions
     */
    findByUserId: (userId: string) => Promise<Session[]>;

    /**
     * Update the last used timestamp for a session
     * @param id Session ID
     * @returns Updated session
     */
    updateLastUsed: (id: string) => Promise<Session | undefined>;

    /**
     * Delete a session
     * @param id Session ID
     * @returns Deleted session or undefined if not found
     */
    delete: (id: string) => Promise<Session | undefined>;

    /**
     * Delete all sessions for a user
     * @param userId User ID
     * @returns Number of deleted sessions
     */
    deleteByUserId: (userId: string) => Promise<number>;

    /**
     * Delete expired sessions
     * @returns Number of deleted sessions
     */
    deleteExpired: () => Promise<number>;
};
