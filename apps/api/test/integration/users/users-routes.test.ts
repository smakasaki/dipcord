/**
 * Integration tests for user endpoints
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("users API", () => {
    const { getServer } = setupApiTest();

    describe("get /v1/users/me", () => {
        it("should return current user profile", async () => {
            const server = getServer();

            // Create authenticated user
            const auth = await authenticatedUser(server, {
                name: "Current",
                surname: "User",
                email: `current.user.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Get current user profile
            const response = await auth.get("/v1/users/me");

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify user data
            expect(body).toHaveProperty("id", auth.user.id);
            expect(body).toHaveProperty("name", auth.user.name);
            expect(body).toHaveProperty("surname", auth.user.surname);
            expect(body).toHaveProperty("email", auth.user.email);
        });

        it("should require authentication", async () => {
            const server = getServer();

            // Try to access without auth
            const response = await server.inject({
                method: "GET",
                url: "/v1/users/me",
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe("put /v1/users/me", () => {
        it("should update current user profile", async () => {
            const server = getServer();

            // Create authenticated user
            const auth = await authenticatedUser(server);

            // Update user data
            const updateData = {
                name: "Updated",
                surname: "Profile",
            };

            // Update current user profile
            const response = await auth.put("/v1/users/me", updateData);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify updated data
            expect(body).toHaveProperty("id", auth.user.id);
            expect(body).toHaveProperty("name", updateData.name);
            expect(body).toHaveProperty("surname", updateData.surname);
            expect(body).toHaveProperty("email", auth.user.email);
        });
    });

    describe("delete /v1/users/me", () => {
        it("should delete current user account and return 204", async () => {
            const server = getServer();

            // Create authenticated user
            const auth = await authenticatedUser(server, {
                name: "Delete",
                surname: "Me",
                email: `delete.me.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Delete current user
            const deleteResponse = await auth.delete("/v1/users/me");

            // Assert response
            expect(deleteResponse.statusCode).toBe(204);

            // Verify authentication is no longer valid
            const profileResponse = await auth.get("/v1/users/me");
            expect(profileResponse.statusCode).toBe(401);
        });
    });

    describe("get /v1/users/:userId", () => {
        it("should return a specific user by ID (public profile)", async () => {
            const server = getServer();

            // Create an authenticated user
            const auth = await authenticatedUser(server, {
                email: `user.get.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Get user by ID
            const response = await auth.get(`/v1/users/${auth.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify user data - public profile should have limited information
            expect(body).toHaveProperty("id", auth.user.id);
            expect(body).toHaveProperty("name", auth.user.name);
            expect(body).toHaveProperty("surname", auth.user.surname);
            expect(body).toHaveProperty("username", auth.user.username);
            // Public profile should not include email
            expect(body).not.toHaveProperty("email");
        });

        it("should return 404 for non-existent user", async () => {
            const server = getServer();

            // Create an authenticated user
            const auth = await authenticatedUser(server);

            // Use a random UUID that doesn't exist
            const nonExistentId = "00000000-0000-0000-0000-000000000000";

            // Get non-existent user
            const response = await auth.get(`/v1/users/${nonExistentId}`);

            // Assert response
            expect(response.statusCode).toBe(404);
        });
    });
});
