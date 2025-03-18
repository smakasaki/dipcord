/**
 * Unit tests for UserService
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SortBy } from "#commons/app/index.js";
import type { User } from "#users/app/models.js";

import { UnauthorizedException } from "#commons/app/index.js";
import { PasswordService } from "#users/app/password-service.js";
import { SessionService } from "#users/app/session-service.js";
import { UserService } from "#users/app/user-service.js";

import { createLoginFixture, createPasswordHashFixture, createSessionFixture, createUserFixture } from "../../../helpers/fixtures.js";
import { createMockSessionRepository, createMockUserRepository } from "../../../helpers/mocks.js";

describe("userService", () => {
    let userService: UserService;
    let passwordService: PasswordService;
    let sessionService: SessionService;
    let userRepository: ReturnType<typeof createMockUserRepository>;
    let sessionRepository: ReturnType<typeof createMockSessionRepository>;

    beforeEach(() => {
        // Create dependencies
        passwordService = new PasswordService();
        userRepository = createMockUserRepository();
        sessionRepository = createMockSessionRepository();
        sessionService = new SessionService(sessionRepository);

        // Create the service under test
        userService = new UserService(
            passwordService,
            sessionService,
            userRepository,
        );
    });

    describe("create", () => {
        it("should create a new user with hashed password", async () => {
            // Arrange
            const userData = {
                name: "Test",
                surname: "User",
                email: "test@example.com",
                password: "SecurePassword123!",
            };

            const passwordHash = { hash: "hashed_password", salt: "random_salt" };
            vi.spyOn(passwordService, "generateHash").mockReturnValue(passwordHash);

            // Act
            const result = await userService.create(userData);

            // Assert
            expect(result).toBeDefined();
            expect(passwordService.generateHash).toHaveBeenCalledWith(userData.password);
            expect(userRepository.create).toHaveBeenCalledWith(
                {
                    name: userData.name,
                    surname: userData.surname,
                    email: userData.email,
                },
                passwordHash,
            );
        });
    });

    describe("login", () => {
        it("should authenticate a user with valid credentials and create a session", async () => {
            // Arrange
            const user = createUserFixture();
            const credentials = createLoginFixture(user.email, "correct_password");
            const passwordHash = createPasswordHashFixture();
            const session = createSessionFixture(user.id);

            // Mock repository and service responses
            vi.spyOn(userRepository, "findByEmail").mockResolvedValue(user);
            vi.spyOn(userRepository, "getPasswordHash").mockResolvedValue(passwordHash);
            vi.spyOn(passwordService, "compare").mockReturnValue(true);
            vi.spyOn(sessionService, "createSession").mockResolvedValue(session);

            // Act
            const result = await userService.login(credentials, "127.0.0.1", "Test Browser");

            // Assert
            expect(result).toEqual({ user, session });
            expect(userRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
            expect(userRepository.getPasswordHash).toHaveBeenCalledWith(user);
            expect(passwordService.compare).toHaveBeenCalledWith(
                credentials.password,
                passwordHash.hash,
                passwordHash.salt,
            );
            expect(sessionService.createSession).toHaveBeenCalledWith(
                user,
                "127.0.0.1",
                "Test Browser",
            );
        });

        it("should throw UnauthorizedException when user is not found", async () => {
            // Arrange
            const credentials = createLoginFixture();
            vi.spyOn(userRepository, "findByEmail").mockResolvedValue(undefined);

            // Act & Assert
            await expect(userService.login(credentials))
                .rejects
                .toThrow(UnauthorizedException);
            expect(userRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
        });

        it("should throw UnauthorizedException when password is incorrect", async () => {
            // Arrange
            const user = createUserFixture();
            const credentials = createLoginFixture(user.email, "wrong_password");
            const passwordHash = createPasswordHashFixture();

            vi.spyOn(userRepository, "findByEmail").mockResolvedValue(user);
            vi.spyOn(userRepository, "getPasswordHash").mockResolvedValue(passwordHash);
            vi.spyOn(passwordService, "compare").mockReturnValue(false);

            // Act & Assert
            await expect(userService.login(credentials))
                .rejects
                .toThrow(UnauthorizedException);

            expect(userRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
            expect(userRepository.getPasswordHash).toHaveBeenCalledWith(user);
            expect(passwordService.compare).toHaveBeenCalledWith(
                credentials.password,
                passwordHash.hash,
                passwordHash.salt,
            );
        });
    });

    describe("logout", () => {
        it("should delete the session and return true on success", async () => {
            // Arrange
            const sessionId = "test-session-id";
            const session = createSessionFixture("user-id", { id: sessionId });

            vi.spyOn(sessionService, "deleteSession").mockResolvedValue(session);

            // Act
            const result = await userService.logout(sessionId);

            // Assert
            expect(result).toBe(true);
            expect(sessionService.deleteSession).toHaveBeenCalledWith(sessionId);
        });

        it("should return false when session is not found", async () => {
            // Arrange
            const sessionId = "non-existent-session";

            vi.spyOn(sessionService, "deleteSession").mockResolvedValue(undefined);

            // Act
            const result = await userService.logout(sessionId);

            // Assert
            expect(result).toBe(false);
            expect(sessionService.deleteSession).toHaveBeenCalledWith(sessionId);
        });
    });

    describe("findAll", () => {
        it("should return paginated users with sorting", async () => {
            // Arrange
            const pagination = { offset: 0, limit: 10 };
            const sortBy: SortBy<User> = [["name", "asc"]];
            const expectedResult = {
                count: 2,
                data: [createUserFixture(), createUserFixture()],
            };

            vi.spyOn(userRepository, "findAll").mockResolvedValue(expectedResult);

            // Act
            const result = await userService.findAll(pagination, sortBy);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(userRepository.findAll).toHaveBeenCalledWith(pagination, sortBy);
        });
    });

    describe("delete", () => {
        it("should delete a user and their sessions", async () => {
            // Arrange
            const userId = "test-user-id";
            const user = createUserFixture({ id: userId });

            vi.spyOn(sessionService, "deleteUserSessions").mockResolvedValue(3);
            vi.spyOn(userRepository, "delete").mockResolvedValue(user);

            // Act
            const result = await userService.delete(userId);

            // Assert
            expect(result).toEqual(user);
            expect(sessionService.deleteUserSessions).toHaveBeenCalledWith(userId);
            expect(userRepository.delete).toHaveBeenCalledWith(userId);
        });

        it("should return undefined when user does not exist", async () => {
            // Arrange
            const userId = "non-existent-user";

            vi.spyOn(sessionService, "deleteUserSessions").mockResolvedValue(0);
            vi.spyOn(userRepository, "delete").mockResolvedValue(undefined);

            // Act
            const result = await userService.delete(userId);

            // Assert
            expect(result).toBeUndefined();
            expect(sessionService.deleteUserSessions).toHaveBeenCalledWith(userId);
            expect(userRepository.delete).toHaveBeenCalledWith(userId);
        });
    });
});
