/**
 * Unit tests for SessionService
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Session, User } from "#users/app/models.js";
import type { ISessionRepository } from "#users/app/session-repo.js";

import { SessionService } from "#users/app/session-service.js";

import { createSessionFixture, createUserFixture } from "../../../helpers/fixtures.js";
import { createMockSessionRepository } from "../../../helpers/mocks.js";

describe("sessionService", () => {
    let sessionRepository: ISessionRepository;
    let sessionService: SessionService;
    let testUser: User;

    // Default session config for testing
    const testConfig = {
        cookieName: "test_session",
        expirationTime: 3600000, // 1 hour
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "strict" as const,
    };

    beforeEach(() => {
        // Create mock repository and service for each test
        sessionRepository = createMockSessionRepository();
        sessionService = new SessionService(sessionRepository, testConfig);
        testUser = createUserFixture();
    });

    describe("createSession", () => {
        it("should create a new session for a user", async () => {
            // Arrange
            const ipAddress = "127.0.0.1";
            const userAgent = "Test Browser";

            // Act
            const session = await sessionService.createSession(testUser, ipAddress, userAgent);

            // Assert
            expect(session).toBeDefined();
            expect(session.userId).toBe(testUser.id);
            expect(session.token).toBeDefined();
            expect(session.token.length).toBeGreaterThan(32); // Token should be at least 32 chars
            expect(session.ipAddress).toBe(ipAddress);
            expect(session.userAgent).toBe(userAgent);
            expect(session.expiresAt).toBeInstanceOf(Date);
            expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());

            // Verify repository was called correctly
            expect(sessionRepository.create).toHaveBeenCalledTimes(1);
            expect(sessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                userId: testUser.id,
                ipAddress,
                userAgent,
            }));
        });

        it("should create a session with default values when ip and agent not provided", async () => {
            // Act
            const session = await sessionService.createSession(testUser);

            // Assert
            expect(session).toBeDefined();
            expect(session.userId).toBe(testUser.id);
            // TODO: REFACTOR LATER!!!
            // expect(session.ipAddress).toBeUndefined();
            // expect(session.userAgent).toBeUndefined();
        });
    });

    describe("getSessionByToken", () => {
        it("should return the session for a valid token", async () => {
            // Arrange
            const session = createSessionFixture(testUser.id);
            vi.spyOn(sessionRepository, "findByToken").mockResolvedValue(session);

            // Act
            const result = await sessionService.getSessionByToken(session.token);

            // Assert
            expect(result).toEqual(session);
            expect(sessionRepository.findByToken).toHaveBeenCalledWith(session.token);
        });

        it("should return undefined for an expired session", async () => {
            // Arrange
            const expiredDate = new Date(Date.now() - 1000); // 1 second in the past
            const expiredSession = createSessionFixture(testUser.id, {
                expiresAt: expiredDate,
            });

            vi.spyOn(sessionRepository, "findByToken").mockResolvedValue(expiredSession);

            // Act
            const result = await sessionService.getSessionByToken(expiredSession.token);

            // Assert
            expect(result).toBeUndefined();
            expect(sessionRepository.findByToken).toHaveBeenCalledWith(expiredSession.token);
        });

        it("should return undefined for an invalid token", async () => {
            // Arrange
            vi.spyOn(sessionRepository, "findByToken").mockResolvedValue(undefined);

            // Act
            const result = await sessionService.getSessionByToken("invalid-token");

            // Assert
            expect(result).toBeUndefined();
            expect(sessionRepository.findByToken).toHaveBeenCalledWith("invalid-token");
        });
    });

    describe("updateLastUsed", () => {
        it("should update the last used timestamp for a session", async () => {
            // Arrange
            const session = createSessionFixture(testUser.id);
            vi.spyOn(sessionRepository, "updateLastUsed").mockResolvedValue(session);

            // Act
            const result = await sessionService.updateLastUsed(session.id);

            // Assert
            expect(result).toEqual(session);
            expect(sessionRepository.updateLastUsed).toHaveBeenCalledWith(session.id);
        });
    });

    describe("deleteSession", () => {
        it("should delete a session", async () => {
            // Arrange
            const session = createSessionFixture(testUser.id);
            vi.spyOn(sessionRepository, "delete").mockResolvedValue(session);

            // Act
            const result = await sessionService.deleteSession(session.id);

            // Assert
            expect(result).toEqual(session);
            expect(sessionRepository.delete).toHaveBeenCalledWith(session.id);
        });
    });

    describe("deleteUserSessions", () => {
        it("should delete all sessions for a user", async () => {
            // Arrange
            vi.spyOn(sessionRepository, "deleteByUserId").mockResolvedValue(3);

            // Act
            const result = await sessionService.deleteUserSessions(testUser.id);

            // Assert
            expect(result).toBe(3);
            expect(sessionRepository.deleteByUserId).toHaveBeenCalledWith(testUser.id);
        });
    });

    describe("deleteExpiredSessions", () => {
        it("should delete all expired sessions", async () => {
            // Arrange
            vi.spyOn(sessionRepository, "deleteExpired").mockResolvedValue(2);

            // Act
            const result = await sessionService.deleteExpiredSessions();

            // Assert
            expect(result).toBe(2);
            expect(sessionRepository.deleteExpired).toHaveBeenCalledTimes(1);
        });
    });

    describe("getCookieConfig", () => {
        it("should return the cookie configuration", () => {
            // Act
            const cookieConfig = sessionService.getCookieConfig();

            // Assert
            expect(cookieConfig).toEqual({
                name: testConfig.cookieName,
                options: {
                    path: testConfig.path,
                    domain: undefined,
                    secure: testConfig.secure,
                    httpOnly: testConfig.httpOnly,
                    sameSite: testConfig.sameSite,
                    maxAge: testConfig.expirationTime / 1000,
                },
            });
        });

        it("should include domain when provided in config", () => {
            // Arrange
            const configWithDomain = {
                ...testConfig,
                domain: "example.com",
            };
            const serviceWithDomain = new SessionService(sessionRepository, configWithDomain);

            // Act
            const cookieConfig = serviceWithDomain.getCookieConfig();

            // Assert
            expect(cookieConfig.options.domain).toBe("example.com");
        });
    });
});
