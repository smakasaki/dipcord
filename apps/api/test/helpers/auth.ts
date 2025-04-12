/**
 * Authentication helpers for testing
 * Provides utilities for creating authenticated requests
 */
import type { FastifyInstance } from "fastify";

import { randomUUID } from "node:crypto";

import type { User } from "#users/app/models.js";

/**
 * Create a user and session for testing
 * @param app Fastify instance
 * @param userData Optional user data overrides
 * @returns User and session token
 */
export async function createTestUser(
    app: FastifyInstance,
    userData: Partial<{
        name: string;
        surname: string;
        email: string;
        username: string;
        password: string;
    }> = {},
): Promise<{ user: User; token: string }> {
    // Check if services are properly registered
    if (!app.userService) {
        throw new Error("userService not available on Fastify instance");
    }

    if (!app.sessionService) {
        throw new Error("sessionService not available on Fastify instance");
    }

    // Create a unique email to avoid conflicts
    const uniqueId = randomUUID().slice(0, 8);

    // Create test user with defaults or overrides
    const user = await app.userService.create({
        name: userData.name ?? "Test",
        surname: userData.surname ?? "User",
        email: userData.email ?? `test.user.${uniqueId}@example.com`,
        username: userData.username ?? `test${uniqueId}`,
        password: userData.password ?? "Password123!",
    });

    // Create a session for the user
    const session = await app.sessionService.createSession(user);

    return {
        user,
        token: session.token,
    };
}

/**
 * Helper to make authenticated requests in tests
 * @param app Fastify instance
 * @param userData Optional user data overrides
 * @returns Object with user and methods for authenticated requests
 */
export async function authenticatedUser(app: FastifyInstance, userData?: Partial<{
    name: string;
    surname: string;
    email: string;
    username: string;
    password: string;
}>) {
    // Check for services
    if (!app.userService || !app.sessionService) {
        console.error("Services available:", {
            userService: !!app.userService,
            sessionService: !!app.sessionService,
        });
        throw new Error("Required services not available on Fastify instance");
    }

    const { user, token } = await createTestUser(app, userData);

    const { name: cookieName } = app.sessionService.getCookieConfig();

    return {
        user,
        token,
        // Helper to make authenticated GET requests
        async get(url: string) {
            return app.inject({
                method: "GET",
                url,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        // Helper to make authenticated POST requests
        async post(url: string, payload?: Record<string, unknown>) {
            return app.inject({
                method: "POST",
                url,
                payload,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        // Helper to make authenticated PUT requests
        async put(url: string, payload: Record<string, unknown>) {
            return app.inject({
                method: "PUT",
                url,
                payload,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        // Helper to make authenticated DELETE requests
        async delete(url: string) {
            return app.inject({
                method: "DELETE",
                url,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
    };
}

/**
 * Helper to create an admin user for testing
 * @param app Fastify instance
 * @param userData Optional user data overrides
 * @returns Object with admin user and methods for authenticated requests
 */
export async function createAdminUser(
    app: FastifyInstance,
    userData?: Partial<{
        name: string;
        surname: string;
        email: string;
        password: string;
    }>,
) {
    // Create a regular user first with admin-related default values
    const { user, token } = await createTestUser(app, {
        name: userData?.name ?? "Admin",
        surname: userData?.surname ?? "User",
        email: userData?.email ?? `admin.user.${randomUUID().substring(0, 8)}@example.com`,
        password: userData?.password,
    });

    // Get cookie name for authorization
    const { name: cookieName } = app.sessionService.getCookieConfig();

    // Grant admin role
    await app.userService.addAdminRole(user.id);

    // Return the admin user with authentication helpers
    return {
        user,
        token,
        async get(url: string) {
            return app.inject({
                method: "GET",
                url,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        async post(url: string, payload?: Record<string, unknown>) {
            return app.inject({
                method: "POST",
                url,
                payload,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        async put(url: string, payload: Record<string, unknown>) {
            return app.inject({
                method: "PUT",
                url,
                payload,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
        async delete(url: string) {
            return app.inject({
                method: "DELETE",
                url,
                cookies: {
                    [cookieName]: token,
                },
            });
        },
    };
}
