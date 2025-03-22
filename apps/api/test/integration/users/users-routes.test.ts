import { randomUUID } from "node:crypto";
/**
 * Integration tests for user endpoints
 */
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("users API", () => {
    const { getServer } = setupApiTest();

    describe("gET /v1/users/:userId", () => {
        it("should return a specific user by ID", async () => {
            const server = getServer();

            // Create an authenticated user
            const auth = await authenticatedUser(server, {
                email: `user.get.${randomUUID().substring(0, 8)}@example.com`, // Уникальный email
            });

            // Get user by ID
            const response = await auth.get(`/v1/users/${auth.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify user data
            expect(body).toHaveProperty("id", auth.user.id);
            expect(body).toHaveProperty("name", auth.user.name);
            expect(body).toHaveProperty("surname", auth.user.surname);
            expect(body).toHaveProperty("username", auth.user.username);
        });

        it("should return 404 for non-existent user", async () => {
            const server = getServer();

            // Create an authenticated user
            const auth = await authenticatedUser(server, {
                email: `user.404.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Use a random UUID that doesn't exist
            const nonExistentId = "00000000-0000-0000-0000-000000000000";

            // Get non-existent user
            const response = await auth.get(`/v1/users/${nonExistentId}`);

            // Assert response
            expect(response.statusCode).toBe(404);
        });
    });
});
