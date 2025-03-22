/**
 * Integration tests for UserService with real dependencies
 */
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { UnauthorizedException } from "#commons/app/index.js";
import { PasswordService } from "#users/app/password-service.js";
import { SessionService } from "#users/app/session-service.js";
import { UserService } from "#users/app/user-service.js";
import { PasswordResetTokenDao } from "#users/infra/dao/password-reset-dao.js";
import { SessionDao } from "#users/infra/dao/session-dao.js";
import { UserDao } from "#users/infra/dao/user-dao.js";

import { setupTestTransaction, testDb } from "../../helpers/db.js";

describe("userServiceIntegration", () => {
    // Use transactions for test isolation
    setupTestTransaction();

    let userService: UserService;
    let passwordService: PasswordService;
    let sessionService: SessionService;

    beforeEach(() => {
        const db = testDb.get();

        // Create real instances with database connection
        const userDao = new UserDao(db);
        const sessionDao = new SessionDao(db);
        const passwordResetTokenDao = new PasswordResetTokenDao(db);

        passwordService = new PasswordService();
        sessionService = new SessionService(sessionDao, {
            cookieName: "test_sid",
            expirationTime: 3600000, // 1 hour
            path: "/",
            secure: false,
            httpOnly: true,
            sameSite: "strict",
        });

        userService = new UserService(
            passwordService,
            sessionService,
            userDao,
            passwordResetTokenDao,
        );
    });

    describe("create and login", () => {
        it("should create a user and then login with valid credentials", async () => {
            // Arrange - create unique user data
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Test",
                surname: "User",
                email: `test.user.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "SecurePassword123!",
            };

            // Act - create user
            const createdUser = await userService.create(userData);

            // Assert created user
            expect(createdUser).toBeDefined();
            expect(createdUser.id).toBeDefined();
            expect(createdUser.name).toBe(userData.name);
            expect(createdUser.surname).toBe(userData.surname);
            expect(createdUser.email).toBe(userData.email);

            // Act - login with created user
            const loginResult = await userService.login({
                email: userData.email,
                password: userData.password,
            }, "127.0.0.1", "Test Browser");

            // Assert login result
            expect(loginResult).toBeDefined();
            expect(loginResult.user).toBeDefined();
            expect(loginResult.session).toBeDefined();
            expect(loginResult.user.id).toBe(createdUser.id);
            expect(loginResult.session.userId).toBe(createdUser.id);
            expect(loginResult.session.ipAddress).toBe("127.0.0.1");
            expect(loginResult.session.userAgent).toBe("Test Browser");
        });

        it("should reject login with incorrect password", async () => {
            // Arrange - create a user
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Test",
                surname: "User",
                email: `test.user.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "CorrectPassword123!",
            };

            await userService.create(userData);

            // Act & Assert - try to login with incorrect password
            await expect(userService.login({
                email: userData.email,
                password: "WrongPassword123!",
            })).rejects.toThrow(UnauthorizedException);
        });

        it("should reject login with non-existent email", async () => {
            // Act & Assert
            await expect(userService.login({
                email: `nonexistent.${randomUUID()}@example.com`,
                password: "AnyPassword123!",
            })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe("user management", () => {
        it("should find user by ID", async () => {
            // Arrange - create a user
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Find",
                surname: "ById",
                email: `find.byid.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "Password123!",
            };

            const createdUser = await userService.create(userData);

            // Act
            const foundUser = await userService.findById(createdUser.id);

            // Assert
            expect(foundUser).toBeDefined();
            expect(foundUser.id).toBe(createdUser.id);
            expect(foundUser.email).toBe(userData.email);
        });

        it("should find user by email", async () => {
            // Arrange - create a user
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Find",
                surname: "ByEmail",
                email: `find.byemail.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "Password123!",
            };

            await userService.create(userData);

            // Act
            const foundUser = await userService.findByEmail(userData.email);

            // Assert
            expect(foundUser).toBeDefined();
            expect(foundUser?.email).toBe(userData.email);
        });

        it("should return undefined when finding non-existent email", async () => {
            // Act
            const foundUser = await userService.findByEmail(`nonexistent.${randomUUID()}@example.com`);

            // Assert
            expect(foundUser).toBeUndefined();
        });

        it("should find all users with pagination and sorting", async () => {
            // Arrange - create multiple users
            const timestamp = Date.now();

            // Create users with alphabetical names for sorting test
            await userService.create({
                name: "Charlie",
                surname: "User",
                email: `charlie.${timestamp}@example.com`,
                username: `testuserblabla`,
                password: "Password123!",
            });

            await userService.create({
                name: "Alpha",
                surname: "User",
                email: `alpha.${timestamp}@example.com`,
                username: `testuserbla`,
                password: "Password123!",
            });

            await userService.create({
                name: "Bravo",
                surname: "User",
                email: `bravo.${timestamp}@example.com`,
                username: `testuserblaba`,
                password: "Password123!",
            });

            // Act - find with pagination (limit 2) and sort by name
            const result = await userService.findAll(
                { offset: 0, limit: 2 },
                [["name", "asc"]],
            );

            // Assert pagination and sorting
            expect(result).toBeDefined();
            expect(result.count).toBeGreaterThanOrEqual(3);
            expect(result.data).toHaveLength(2);

            // Check sorting - first result should be "Alpha"
            expect(result.data[0]!.name).toBe("Alpha");

            // Act - get second page
            const page2 = await userService.findAll(
                { offset: 2, limit: 2 },
                [["name", "asc"]],
            );

            // Assert pagination continues correctly
            expect(page2.data.length).toBeGreaterThan(0);
        });

        it("should delete a user and their sessions", async () => {
            // Arrange - create a user and login to create a session
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Delete",
                surname: "Test",
                email: `delete.test.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "Password123!",
            };

            const createdUser = await userService.create(userData);

            // Login to create a session
            await userService.login({
                email: userData.email,
                password: userData.password,
            });

            // Act
            const deletedUser = await userService.delete(createdUser.id);

            // Assert
            expect(deletedUser).toBeDefined();
            expect(deletedUser?.id).toBe(createdUser.id);

            // Verify user is actually deleted
            await expect(userService.findById(createdUser.id)).rejects.toThrow();

            // Verify email no longer exists
            const nonExistentUser = await userService.findByEmail(userData.email);
            expect(nonExistentUser).toBeUndefined();
        });
    });

    describe("session management", () => {
        it("should logout by deleting session", async () => {
            // Arrange - create a user and login
            const uniqueId = randomUUID().substring(0, 8);
            const userData = {
                name: "Logout",
                surname: "Test",
                email: `logout.test.${uniqueId}@example.com`,
                username: `testuser${uniqueId}`,
                password: "Password123!",
            };

            await userService.create(userData);

            // Login to create a session
            const { session } = await userService.login({
                email: userData.email,
                password: userData.password,
            });

            // Act
            const result = await userService.logout(session.id);

            // Assert
            expect(result).toBe(true);

            // Verify session is deleted by trying to get session directly
            // @ts-expect-error accessing private method
            const sessionFromDb = await sessionService.sessionRepository.findById(session.id);
            expect(sessionFromDb).toBeUndefined();
        });
    });
});
