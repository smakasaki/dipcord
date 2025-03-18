/**
 * Integration tests for SessionDao
 * Focus on database interactions without API layer
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { SessionDao } from "#users/infra/dao/session-dao.js";
import { UserDao } from "#users/infra/dao/user-dao.js";

import { setupTestTransaction, testDb } from "../../helpers/db.js";
import { createPasswordHashFixture } from "../../helpers/fixtures.js";

describe("sessionDao", () => {
    // Use transactions for test isolation
    setupTestTransaction();
    const getDb = () => testDb.get();

    // Helper to create a test user for sessions
    const createTestUser = async () => {
        const db = getDb();
        const userDao = new UserDao(db);

        const uniqueId = randomUUID().substring(0, 8);
        const timestamp = Date.now();
        const email = `test.user.${uniqueId}.${timestamp}@example.com`;

        const userData = {
            name: "Test",
            surname: "User",
            email,
        };

        const passwordHash = createPasswordHashFixture();
        return userDao.create(userData, passwordHash);
    };

    describe("create", () => {
        it("should create a new session for a user", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            const sessionData = {
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                ipAddress: "127.0.0.1",
                userAgent: "Test Browser",
                expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            };

            // Act
            const session = await sessionDao.create(sessionData);

            // Assert
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.userId).toBe(user.id);
            expect(session.token).toBe(sessionData.token);
            expect(session.ipAddress).toBe(sessionData.ipAddress);
            expect(session.userAgent).toBe(sessionData.userAgent);
            expect(session.expiresAt.getTime()).toBeCloseTo(sessionData.expiresAt.getTime(), -2); // Allow small time difference
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.lastUsedAt).toBeInstanceOf(Date);
        });

        it("should reject duplicate tokens", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            const token = randomUUID().replace(/-/g, "");

            // Create first session
            await sessionDao.create({
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act & Assert - try to create another session with the same token
            await expect(async () => {
                await sessionDao.create({
                    userId: user.id,
                    token,
                    expiresAt: new Date(Date.now() + 3600000),
                });
            }).rejects.toThrow(/duplicate key/);
        });

        it("should handle nullable fields correctly", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            const sessionData = {
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                // No ipAddress or userAgent
                expiresAt: new Date(Date.now() + 3600000),
            };

            // Act
            const session = await sessionDao.create(sessionData);

            // Assert
            expect(session).toBeDefined();
            expect(session.ipAddress).toBeUndefined();
            expect(session.userAgent).toBeUndefined();
        });
    });

    describe("findByToken", () => {
        it("should find a session by token", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            const token = randomUUID().replace(/-/g, "");

            // Create a session
            const createdSession = await sessionDao.create({
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const foundSession = await sessionDao.findByToken(token);

            // Assert
            expect(foundSession).toBeDefined();
            expect(foundSession?.id).toBe(createdSession.id);
            expect(foundSession?.token).toBe(token);
        });

        it("should return undefined for non-existent token", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentToken = "non-existent-token";

            // Act
            const foundSession = await sessionDao.findByToken(nonExistentToken);

            // Assert
            expect(foundSession).toBeUndefined();
        });
    });

    describe("findById", () => {
        it("should find a session by ID", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create a session
            const createdSession = await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const foundSession = await sessionDao.findById(createdSession.id);

            // Assert
            expect(foundSession).toBeDefined();
            expect(foundSession?.id).toBe(createdSession.id);
        });

        it("should return undefined for non-existent ID", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentId = randomUUID();

            // Act
            const foundSession = await sessionDao.findById(nonExistentId);

            // Assert
            expect(foundSession).toBeUndefined();
        });
    });

    describe("findByUserId", () => {
        it("should find all sessions for a user", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create multiple sessions for the same user
            const session1 = await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            const session2 = await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const sessions = await sessionDao.findByUserId(user.id);

            // Assert
            expect(sessions).toHaveLength(2);
            expect(sessions.map(s => s.id)).toContain(session1.id);
            expect(sessions.map(s => s.id)).toContain(session2.id);
        });

        it("should return empty array for user with no sessions", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentUserId = randomUUID();

            // Act
            const sessions = await sessionDao.findByUserId(nonExistentUserId);

            // Assert
            expect(sessions).toHaveLength(0);
        });
    });

    describe("updateLastUsed", () => {
        it("should update the last used timestamp for a session", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create a session
            const session = await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Store original lastUsedAt
            const originalLastUsed = session.lastUsedAt;

            // Wait a small amount of time to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            // Act
            const updatedSession = await sessionDao.updateLastUsed(session.id);

            // Assert
            expect(updatedSession).toBeDefined();
            expect(updatedSession?.id).toBe(session.id);
            expect(updatedSession?.lastUsedAt.getTime()).toBeGreaterThan(originalLastUsed.getTime());
        });

        it("should return undefined for non-existent session", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentId = randomUUID();

            // Act
            const updatedSession = await sessionDao.updateLastUsed(nonExistentId);

            // Assert
            expect(updatedSession).toBeUndefined();
        });
    });

    describe("delete", () => {
        it("should delete a session", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create a session
            const session = await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const deletedSession = await sessionDao.delete(session.id);

            // Assert
            expect(deletedSession).toBeDefined();
            expect(deletedSession?.id).toBe(session.id);

            // Verify session is actually deleted
            const foundSession = await sessionDao.findById(session.id);
            expect(foundSession).toBeUndefined();
        });

        it("should return undefined when deleting non-existent session", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentId = randomUUID();

            // Act
            const deletedSession = await sessionDao.delete(nonExistentId);

            // Assert
            expect(deletedSession).toBeUndefined();
        });
    });

    describe("deleteByUserId", () => {
        it("should delete all sessions for a user", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create multiple sessions for the user
            await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const deletedCount = await sessionDao.deleteByUserId(user.id);

            // Assert
            expect(deletedCount).toBe(2);

            // Verify sessions are actually deleted
            const sessions = await sessionDao.findByUserId(user.id);
            expect(sessions).toHaveLength(0);
        });

        it("should return 0 when deleting sessions for non-existent user", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const nonExistentUserId = randomUUID();

            // Act
            const deletedCount = await sessionDao.deleteByUserId(nonExistentUserId);

            // Assert
            expect(deletedCount).toBe(0);
        });
    });

    describe("deleteExpired", () => {
        it("should delete expired sessions", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create an expired session (1 hour in the past)
            await sessionDao.create({
                userId: user.id,
                token: `${randomUUID().replace(/-/g, "")}_expired`,
                expiresAt: new Date(Date.now() - 3600000),
            });

            // Create a valid session (1 hour in the future)
            const validSession = await sessionDao.create({
                userId: user.id,
                token: `${randomUUID().replace(/-/g, "")}_valid`,
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const deletedCount = await sessionDao.deleteExpired();

            // Assert
            expect(deletedCount).toBe(1); // Only the expired session

            // Verify valid session still exists
            const session = await sessionDao.findById(validSession.id);
            expect(session).toBeDefined();
        });

        it("should return 0 when no expired sessions exist", async () => {
            // Arrange
            const db = getDb();
            const sessionDao = new SessionDao(db);
            const user = await createTestUser();

            // Create only valid sessions
            await sessionDao.create({
                userId: user.id,
                token: randomUUID().replace(/-/g, ""),
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Act
            const deletedCount = await sessionDao.deleteExpired();

            // Assert
            expect(deletedCount).toBe(0);
        });
    });
});
