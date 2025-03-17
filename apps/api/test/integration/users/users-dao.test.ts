import { randomUUID } from "node:crypto";
/**
 * Integration tests for UserDao
 * Focus on database interactions without API layer
 */
import { describe, expect, it } from "vitest";

import { UserDao } from "#users/infra/dao/user-dao.js";

import { setupTestDatabase, setupTestTransaction } from "../../helpers/db.js";
import { createPasswordHashFixture } from "../../helpers/fixtures.js";

describe("userDao", () => {
    // Set up the database connection
    const { getDb } = setupTestDatabase();

    // Use transactions for test isolation
    setupTestTransaction();

    // Create a test user creation helper
    const createTestUser = async (dao: UserDao, emailSuffix = "") => {
        const uniqueId = randomUUID().substring(0, 8);
        const timestamp = Date.now();
        const email = `test.user.${uniqueId}.${timestamp}${emailSuffix}@example.com`;

        const userData = {
            name: "Test",
            surname: "User",
            email,
        };

        const passwordHash = createPasswordHashFixture();
        return dao.create(userData, passwordHash);
    };

    describe("create", () => {
        it("should create a new user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Act
            const user = await createTestUser(userDao);

            // Assert
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toContain("test.user");
            expect(user.name).toBe("Test");
            expect(user.surname).toBe("User");
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it("should reject duplicate email", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a user with a specific email
            const suffix = `.unique.${Date.now()}`;
            const user = await createTestUser(userDao, suffix);

            // Act & Assert - try to create another user with the same email
            await expect(async () => {
                const userData = {
                    name: "Another",
                    surname: "User",
                    email: user.email, // Same email
                };

                await userDao.create(userData, createPasswordHashFixture());
            }).rejects.toThrow(/duplicate key/);
        });
    });

    describe("findById", () => {
        it("should find a user by ID", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a test user
            const createdUser = await createTestUser(userDao);

            // Act
            const foundUser = await userDao.findById(createdUser.id);

            // Assert
            expect(foundUser).toBeDefined();
            expect(foundUser?.id).toBe(createdUser.id);
            expect(foundUser?.email).toBe(createdUser.email);
        });

        it("should return undefined for non-existent user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);
            const nonExistentId = randomUUID();

            // Act
            const foundUser = await userDao.findById(nonExistentId);

            // Assert
            expect(foundUser).toBeUndefined();
        });
    });

    describe("findByEmail", () => {
        it("should find a user by email", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a test user
            const createdUser = await createTestUser(userDao);

            // Act
            const foundUser = await userDao.findByEmail(createdUser.email);

            // Assert
            expect(foundUser).toBeDefined();
            expect(foundUser?.id).toBe(createdUser.id);
            expect(foundUser?.email).toBe(createdUser.email);
        });

        it("should return undefined for non-existent email", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);
            const nonExistentEmail = `non.existent.${randomUUID()}@example.com`;

            // Act
            const foundUser = await userDao.findByEmail(nonExistentEmail);

            // Assert
            expect(foundUser).toBeUndefined();
        });
    });

    describe("findAll", () => {
        it("should return paginated users", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create multiple test users
            const _user1 = await createTestUser(userDao, ".findall.1");
            const _user2 = await createTestUser(userDao, ".findall.2");
            const _user3 = await createTestUser(userDao, ".findall.3");

            // Act - get first page (2 users)
            const result = await userDao.findAll({ offset: 0, limit: 2 }, [["createdAt", "desc"]]);

            // Assert
            expect(result.count).toBeGreaterThanOrEqual(3);
            expect(result.data.length).toBe(2);

            // Act - get second page
            const page2 = await userDao.findAll({ offset: 2, limit: 2 }, [["createdAt", "desc"]]);

            // Assert
            expect(page2.count).toBeGreaterThanOrEqual(3);
            expect(page2.data.length).toBeGreaterThan(0);
        });

        it("should sort users correctly", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create users with different names for sorting
            await createTestUser(userDao, ".sort.a");
            await createTestUser(userDao, ".sort.b");
            await createTestUser(userDao, ".sort.c");

            // Act - sort by email ascending
            const ascResult = await userDao.findAll(
                { offset: 0, limit: 10 },
                [["email", "asc"]],
            );

            // Assert emails are in ascending order
            const ascEmails = ascResult.data.map(u => u.email);
            const sortedAscEmails = [...ascEmails].sort();
            expect(ascEmails).toEqual(sortedAscEmails);

            // Act - sort by email descending
            const descResult = await userDao.findAll(
                { offset: 0, limit: 10 },
                [["email", "desc"]],
            );

            // Assert emails are in descending order
            const descEmails = descResult.data.map(u => u.email);
            const sortedDescEmails = [...descEmails].sort().reverse();
            expect(descEmails).toEqual(sortedDescEmails);
        });
    });

    describe("getPasswordHash", () => {
        it("should return password hash and salt for a user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a test user with known password hash
            const userData = {
                name: "Password",
                surname: "Test",
                email: `password.test.${randomUUID().substring(0, 8)}@example.com`,
            };

            const passwordFixture = createPasswordHashFixture();
            const user = await userDao.create(userData, passwordFixture);

            // Act
            const passwordHash = await userDao.getPasswordHash(user);

            // Assert
            expect(passwordHash).toBeDefined();
            expect(passwordHash.hash).toBe(passwordFixture.hash);
            expect(passwordHash.salt).toBe(passwordFixture.salt);
        });

        it("should throw error for non-existent user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a fake user object with valid structure but non-existent ID
            const fakeUser = {
                id: randomUUID(),
                name: "Fake",
                surname: "User",
                email: "fake@example.com",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Act & Assert
            await expect(userDao.getPasswordHash(fakeUser)).rejects.toThrow();
        });
    });

    describe("delete", () => {
        it("should delete a user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);

            // Create a test user
            const user = await createTestUser(userDao, ".delete");

            // Act
            const deletedUser = await userDao.delete(user.id);

            // Assert that delete returned the user
            expect(deletedUser).toBeDefined();
            expect(deletedUser?.id).toBe(user.id);

            // Verify user is actually deleted
            const foundUser = await userDao.findById(user.id);
            expect(foundUser).toBeUndefined();
        });

        it("should return undefined when deleting non-existent user", async () => {
            // Arrange
            const db = getDb();
            const userDao = new UserDao(db);
            const nonExistentId = randomUUID();

            // Act
            const deletedUser = await userDao.delete(nonExistentId);

            // Assert
            expect(deletedUser).toBeUndefined();
        });
    });
});
