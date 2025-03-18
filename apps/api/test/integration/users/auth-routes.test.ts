/**
 * Integration tests for authentication endpoints
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("auth API", () => {
    const { getServer } = setupApiTest();

    describe("pOST /v1/auth/login", () => {
        it("should login user with valid credentials and set session cookie", async () => {
            const server = getServer();

            // Create a test user with known credentials
            const email = `login.test.${randomUUID().substring(0, 8)}@example.com`;
            const password = "SecurePassword123!";

            // Use the authenticated user helper to create a user
            const { user } = await authenticatedUser(server, {
                name: "Login",
                surname: "Test",
                email,
                password,
            });

            // Login with the created user (directly, not using the helper)
            const loginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email,
                    password,
                },
            });

            // Assert response
            expect(loginResponse.statusCode).toBe(200);

            // Verify user data in response
            const loggedInUser = JSON.parse(loginResponse.body);
            expect(loggedInUser.id).toBe(user.id);
            expect(loggedInUser.email).toBe(email);

            // Verify session cookie was set
            const cookies = loginResponse.cookies;
            expect(cookies).toHaveLength(1);
            expect(cookies[0]!.name).toBe("test_sid"); // Test cookie name from test setup
            expect(cookies[0]!.value).toBeDefined();
        });

        it("should return 401 with invalid credentials", async () => {
            const server = getServer();

            // Try to login with non-existent user
            const loginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email: `nonexistent.${randomUUID().substring(0, 8)}@example.com`,
                    password: "InvalidPassword123!",
                },
            });

            // Assert response
            expect(loginResponse.statusCode).toBe(401);

            // Verify there are no cookies
            const cookies = loginResponse.cookies;
            expect(cookies).toHaveLength(0);
        });

        it("should return 401 with correct email but wrong password", async () => {
            const server = getServer();

            // Create a test user
            const { user } = await authenticatedUser(server);

            // Try to login with correct email but wrong password
            const loginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email: user.email,
                    password: "WrongPassword123!",
                },
            });

            // Assert response
            expect(loginResponse.statusCode).toBe(401);
        });

        it("should validate request payload", async () => {
            const server = getServer();

            // Try to login with invalid payload (missing password)
            const loginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email: "test@example.com",
                    // missing password
                },
            });

            // Assert response (should be 400 for validation error)
            expect(loginResponse.statusCode).toBe(400);
        });
    });

    describe("pOST /v1/auth/logout", () => {
        it("should logout user and clear session cookie", async () => {
            const server = getServer();

            // Create an authenticated user using the helper
            const auth = await authenticatedUser(server);

            // Logout using the authenticated user's token
            const logoutResponse = await auth.post("/v1/auth/logout");

            // Assert response
            expect(logoutResponse.statusCode).toBe(204);

            // Verify cookie was cleared
            const responseCookies = logoutResponse.cookies;
            expect(responseCookies).toHaveLength(1);
            expect(responseCookies[0]!.name).toBe("test_sid");
            expect(responseCookies[0]!.value).toBe("");

            // Verify session is actually invalidated by trying to access a protected route
            const profileResponse = await server.inject({
                method: "GET",
                url: "/v1/auth/profile",
                cookies: { test_sid: auth.token },
            });

            expect(profileResponse.statusCode).toBe(401);
        });

        it("should return 401 when not authenticated", async () => {
            const server = getServer();

            // Attempt to logout without being logged in
            const logoutResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/logout",
            });

            // Assert response
            expect(logoutResponse.statusCode).toBe(401);
        });
    });

    describe("gET /v1/auth/profile", () => {
        it("should return user profile when authenticated", async () => {
            const server = getServer();

            // Create an authenticated user
            const auth = await authenticatedUser(server, {
                name: "Profile",
                surname: "Test",
            });

            // Get profile using authenticated helper
            const profileResponse = await auth.get("/v1/auth/profile");

            // Assert response
            expect(profileResponse.statusCode).toBe(200);

            // Verify profile data
            const profile = JSON.parse(profileResponse.body);
            expect(profile.id).toBe(auth.user.id);
            expect(profile.email).toBe(auth.user.email);
            expect(profile.name).toBe("Profile");
            expect(profile.surname).toBe("Test");
        });

        it("should return 401 when not authenticated", async () => {
            const server = getServer();

            // Try to get profile without authentication
            const profileResponse = await server.inject({
                method: "GET",
                url: "/v1/auth/profile",
            });

            // Assert response
            expect(profileResponse.statusCode).toBe(401);
        });

        it("should return 401 with an invalid session token", async () => {
            const server = getServer();

            // Try to get profile with an invalid token
            const profileResponse = await server.inject({
                method: "GET",
                url: "/v1/auth/profile",
                cookies: { test_sid: "invalid-token" },
            });

            // Assert response
            expect(profileResponse.statusCode).toBe(401);
        });
    });
});
