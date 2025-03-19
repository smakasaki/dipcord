import { randomBytes } from "node:crypto";

import type { Session, User } from "./models.js";
import type { ISessionRepository } from "./session-repo.js";

/**
 * Session configuration
 */
export type SessionConfig = {
    cookieName: string;
    expirationTime: number;
    path: string;
    domain?: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
};

/**
 * Session Service
 * Handles session creation, validation, and management
 */
export class SessionService {
    private static readonly DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

    /**
     * Create a new SessionService
     * @param sessionRepository Repository for session data access
     * @param config Session configuration
     */
    constructor(
        private readonly sessionRepository: ISessionRepository,
        private readonly config: SessionConfig = {
            cookieName: "sid",
            expirationTime: SessionService.DEFAULT_EXPIRATION,
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "strict",
        },
    ) {}

    /**
     * Create a new session for a user
     * @param user User to create session for
     * @param ipAddress IP address of the client
     * @param userAgent User agent of the client
     * @returns Created session
     */
    async createSession(user: User, ipAddress?: string, userAgent?: string): Promise<Session> {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + this.config.expirationTime);

        return this.sessionRepository.create({
            userId: user.id,
            token,
            ipAddress,
            userAgent,
            expiresAt,
        });
    }

    /**
     * Get a session by token
     * @param token Session token
     * @returns Session or undefined if not found/expired
     */
    async getSessionByToken(token: string): Promise<Session | undefined> {
        const session = await this.sessionRepository.findByToken(token);

        if (!session || new Date(session.expiresAt) < new Date()) {
            return undefined;
        }

        return session;
    }

    /**
     * Find all sessions for a user
     * @param userId User ID
     * @returns Array of sessions
     */
    async findSessionsByUserId(userId: string): Promise<Session[]> {
        return this.sessionRepository.findByUserId(userId);
    }

    /**
     * Update the last used timestamp for a session
     * @param sessionId Session ID
     * @returns Updated session
     */
    async updateLastUsed(sessionId: string): Promise<Session | undefined> {
        return this.sessionRepository.updateLastUsed(sessionId);
    }

    /**
     * Delete a session
     * @param sessionId Session ID
     * @returns Deleted session or undefined if not found
     */
    async deleteSession(sessionId: string): Promise<Session | undefined> {
        return this.sessionRepository.delete(sessionId);
    }

    /**
     * Delete all sessions for a user
     * @param userId User ID
     * @returns Number of deleted sessions
     */
    async deleteUserSessions(userId: string): Promise<number> {
        return this.sessionRepository.deleteByUserId(userId);
    }

    /**
     * Delete expired sessions
     * @returns Number of deleted sessions
     */
    async deleteExpiredSessions(): Promise<number> {
        return this.sessionRepository.deleteExpired();
    }

    /**
     * Get cookie configuration
     * @returns Cookie configuration object
     */
    getCookieConfig() {
        return {
            name: this.config.cookieName,
            options: {
                path: this.config.path,
                domain: this.config.domain,
                secure: this.config.secure,
                httpOnly: this.config.httpOnly,
                sameSite: this.config.sameSite,
                maxAge: this.config.expirationTime / 1000, // Convert to seconds for cookies
            },
        };
    }
}
