import { randomUUID } from "node:crypto";
/**
 * Integration tests for user endpoints
 */
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupIntegrationTest } from "../setup.js";

describe("users API", () => {
    const { getServer } = setupIntegrationTest();

    describe("gET /v1/users", () => {
        it("should return paginated users", async () => {
            const server = getServer();

            // Create several users for pagination testing
            const auth1 = await authenticatedUser(server, {
                name: "User",
                surname: "One",
                email: `user.one.${randomUUID().substring(0, 8)}@example.com`, // Уникальный email
            });

            const _auth2 = await authenticatedUser(server, {
                name: "User",
                surname: "Two",
                email: `user.two.${randomUUID().substring(0, 8)}.${Date.now()}@example.com`,
            });

            const _auth3 = await authenticatedUser(server, {
                name: "User",
                surname: "Three",
                email: `user.three.${randomUUID().substring(0, 8)}.${Date.now()}@example.com`,
            });

            // Get users with pagination
            const response = await auth1.get("/v1/users?limit=2&offset=0");

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify pagination structure
            expect(body).toHaveProperty("count");
            expect(body).toHaveProperty("data");
            expect(body.count).toBeGreaterThanOrEqual(3);
            expect(body.data.length).toBeGreaterThanOrEqual(1);

            // Verify structure of user objects
            body.data.forEach((user: any) => {
                expect(user).toHaveProperty("id");
                expect(user).toHaveProperty("name");
                expect(user).toHaveProperty("surname");
                expect(user).toHaveProperty("email");
                expect(user).toHaveProperty("createdAt");
                expect(user).toHaveProperty("updatedAt");
            });

            // Test sorting
            const sortedResponse = await auth1.get("/v1/users?sort=email.asc");
            const sortedBody = JSON.parse(sortedResponse.body);

            // Verify emails are sorted alphabetically
            const emails = sortedBody.data.map((user: any) => user.email);
            const sortedEmails = [...emails].sort();
            expect(emails).toEqual(sortedEmails);
        });

        it("should require authentication", async () => {
            const server = getServer();

            // Try to access without auth
            const response = await server.inject({
                method: "GET",
                url: "/v1/users",
            });

            expect(response.statusCode).toBe(401);
        });
    });

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
            expect(body).toHaveProperty("email", auth.user.email);
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

    describe("dELETE /v1/users/:userId", () => {
        it("should delete a user and return 204", async () => {
            const server = getServer();

            // Create a user to delete
            const { user } = await authenticatedUser(server, {
                name: "Delete",
                surname: "Me",
                email: `delete.me.${randomUUID().substring(0, 8)}@example.com`, // Уникальный email
            });

            // Create another user to perform the deletion
            const auth = await authenticatedUser(server, {
                name: "Admin",
                surname: "User",
                email: `admin.user.${randomUUID().substring(0, 8)}@example.com`, // Уникальный email
            });

            // Delete the first user
            const deleteResponse = await auth.delete(`/v1/users/${user.id}`);

            // Assert response
            expect(deleteResponse.statusCode).toBe(204);

            // Verify user is deleted by trying to fetch it
            const getResponse = await auth.get(`/v1/users/${user.id}`);
            expect(getResponse.statusCode).toBe(404);
        });
    });
});
