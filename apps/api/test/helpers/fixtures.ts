/**
 * Test fixtures for common test data
 * Provides factory functions for creating test entities
 */
import { randomUUID } from "node:crypto";

import type { PasswordHashWithSalt, Session, User } from "#users/app/models.js";

/**
 * Create a test user object
 * @param overrides Optional field overrides
 * @returns User object for testing
 */
export function createUserFixture(overrides: Partial<User> = {}): User {
    const uniqueId = randomUUID().slice(0, 8);

    return {
        id: overrides.id ?? randomUUID(),
        name: overrides.name ?? "Test",
        surname: overrides.surname ?? "User",
        email: overrides.email ?? `test.user.${uniqueId}@example.com`,
        username: overrides.username ?? `testuser_${uniqueId}`,
        roles: overrides.roles ?? ["user"],
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

/**
 * Create a test password hash and salt
 * @returns Password hash and salt for testing
 */
export function createPasswordHashFixture(): PasswordHashWithSalt {
    return {
        hash: "hashedpassword123456789012345678901234567890123456789012345678901234567890",
        salt: "salt123456789012345678901234567890",
    };
}

/**
 * Create a test session object
 * @param userId User ID for the session
 * @param overrides Optional field overrides
 * @returns Session object for testing
 */
export function createSessionFixture(
    userId: string,
    overrides: Partial<Session> = {},
): Session {
    return {
        id: overrides.id ?? randomUUID(),
        userId,
        token: overrides.token ?? randomUUID().replace(/-/g, ""),
        ipAddress: overrides.ipAddress ?? "127.0.0.1",
        userAgent: overrides.userAgent ?? "Test User Agent",
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: overrides.createdAt ?? new Date(),
        lastUsedAt: overrides.lastUsedAt ?? new Date(),
    };
}

/**
 * Create a test user login data
 * @param email Optional email override
 * @param password Optional password override
 */
export function createLoginFixture(
    email = "test@example.com",
    password = "Password123!",
) {
    return {
        email,
        password,
    };
}
