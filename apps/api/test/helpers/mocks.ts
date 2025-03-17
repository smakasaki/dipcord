import { randomUUID } from "node:crypto";
/**
 * Common mocks for tests
 * Provides mock implementations of repositories and services
 */
import { vi } from "vitest";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { CreateSessionData, CreateUser, PasswordHashWithSalt, Session, User } from "#users/app/models.js";
import type { ISessionRepository } from "#users/app/session-repo.js";
import type { IUserRepository } from "#users/app/user-repo.js";

import { createPasswordHashFixture, createSessionFixture, createUserFixture } from "./fixtures.js";

/**
 * Create mock user repository for testing
 * @param customImplementation Optional custom implementation
 * @returns Mocked user repository
 */
export function createMockUserRepository(
    customImplementation: Partial<IUserRepository> = {},
): IUserRepository {
    // Default mock users storage
    const users: User[] = [];
    const passwordHashes: Record<string, PasswordHashWithSalt> = {};

    // Create mock repository with default implementations
    return {
    // Create user implementation
        create: vi.fn(async (userData: Omit<CreateUser, "password">, passwordHash: PasswordHashWithSalt) => {
            const id = randomUUID();
            const user: User = {
                id,
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            users.push(user);
            passwordHashes[id] = passwordHash;

            return user;
        }),

        // Find all users implementation
        findAll: vi.fn(async (
            pagination: Pagination,
            // eslint-disable-next-line unused-imports/no-unused-vars
            sortBy: SortBy<User>,
        ): Promise<PaginatedResult<User>> => {
            const { offset, limit } = pagination;
            const data = users.slice(offset, offset + limit);

            return {
                count: users.length,
                data,
            };
        }),

        // Find user by ID implementation
        findById: vi.fn(async (id: string): Promise<User | undefined> => {
            return users.find(user => user.id === id);
        }),

        // Find user by email implementation
        findByEmail: vi.fn(async (email: string): Promise<User | undefined> => {
            return users.find(user => user.email === email);
        }),

        // Get password hash implementation
        getPasswordHash: vi.fn(async (user: User): Promise<PasswordHashWithSalt> => {
            return passwordHashes[user.id] || createPasswordHashFixture();
        }),

        // Delete user implementation
        delete: vi.fn(async (id: string): Promise<User | undefined> => {
            const index = users.findIndex(user => user.id === id);
            if (index === -1)
                return undefined;

            const user = users[index];
            users.splice(index, 1);
            delete passwordHashes[id];

            return user;
        }),

        // Override with custom implementations
        ...customImplementation,
    };
}

/**
 * Create mock session repository for testing
 * @param customImplementation Optional custom implementation
 * @returns Mocked session repository
 */
export function createMockSessionRepository(
    customImplementation: Partial<ISessionRepository> = {},
): ISessionRepository {
    // Default mock sessions storage
    const sessions: Session[] = [];

    // Create mock repository with default implementations
    return {
    // Create session implementation
        create: vi.fn(async (data: CreateSessionData): Promise<Session> => {
            const session = createSessionFixture(data.userId, {
                token: data.token,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                expiresAt: data.expiresAt,
            });

            sessions.push(session);
            return session;
        }),

        // Find session by token implementation
        findByToken: vi.fn(async (token: string): Promise<Session | undefined> => {
            return sessions.find(session => session.token === token);
        }),

        // Find session by ID implementation
        findById: vi.fn(async (id: string): Promise<Session | undefined> => {
            return sessions.find(session => session.id === id);
        }),

        // Find sessions by user ID implementation
        findByUserId: vi.fn(async (userId: string): Promise<Session[]> => {
            return sessions.filter(session => session.userId === userId);
        }),

        // Update last used timestamp implementation
        updateLastUsed: vi.fn(async (id: string): Promise<Session | undefined> => {
            const session = sessions.find(session => session.id === id);
            if (!session)
                return undefined;

            session.lastUsedAt = new Date();
            return session;
        }),

        // Delete session implementation
        delete: vi.fn(async (id: string): Promise<Session | undefined> => {
            const index = sessions.findIndex(session => session.id === id);
            if (index === -1)
                return undefined;

            const session = sessions[index];
            sessions.splice(index, 1);

            return session;
        }),

        // Delete sessions by user ID implementation
        deleteByUserId: vi.fn(async (userId: string): Promise<number> => {
            const initialLength = sessions.length;
            const remainingSessions = sessions.filter(session => session.userId !== userId);
            sessions.length = 0;
            sessions.push(...remainingSessions);

            return initialLength - remainingSessions.length;
        }),

        // Delete expired sessions implementation
        deleteExpired: vi.fn(async (): Promise<number> => {
            const now = new Date();
            const initialLength = sessions.length;
            const remainingSessions = sessions.filter(session => session.expiresAt > now);
            sessions.length = 0;
            sessions.push(...remainingSessions);

            return initialLength - remainingSessions.length;
        }),

        // Override with custom implementations
        ...customImplementation,
    };
}

/**
 * Create a mock Fastify instance for testing
 * @returns Mocked partial Fastify instance
 */
export function createMockFastifyInstance() {
    return {
        log: {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
        },
        decorate: vi.fn(),
        register: vi.fn(),
        addHook: vi.fn(),
        inject: vi.fn(),
    };
}
