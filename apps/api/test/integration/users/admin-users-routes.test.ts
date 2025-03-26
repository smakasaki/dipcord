/**
 * Integration tests for admin user endpoints
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import user from "#users/infra/services/user.js";

import { authenticatedUser, createAdminUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("admin users API", () => {
    const { getServer } = setupApiTest();

    describe("gET /v1/admin/users", () => {
        it("should return paginated users for admin", async () => {
            const server = getServer();

            // Create several users for pagination testing
            await authenticatedUser(server, {
                name: "User",
                surname: "One",
                email: `user.one.${randomUUID().substring(0, 8)}@example.com`,
            });

            await authenticatedUser(server, {
                name: "User",
                surname: "Two",
                email: `user.two.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create an admin user
            const admin = await createAdminUser(server);

            // Get users with pagination
            const response = await admin.get("/v1/admin/users?limit=2&offset=0");

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify pagination structure
            expect(body).toHaveProperty("count");
            expect(body).toHaveProperty("data");
            expect(body.count).toBeGreaterThanOrEqual(3); // at least the 3 users we've created
            expect(body.data.length).toBeLessThanOrEqual(2); // respects the limit

            // Verify structure of user objects
            body.data.forEach((user: any) => {
                expect(user).toHaveProperty("id");
                expect(user).toHaveProperty("name");
                expect(user).toHaveProperty("surname");
                expect(user).toHaveProperty("email");
                expect(user).toHaveProperty("roles");
                expect(user).toHaveProperty("createdAt");
                expect(user).toHaveProperty("updatedAt");
            });

            // Test sorting
            const sortedResponse = await admin.get("/v1/admin/users?sort=email.asc");
            const sortedBody = JSON.parse(sortedResponse.body);

            // Verify emails are sorted alphabetically
            const emails = sortedBody.data.map((user: any) => user.email);
            const sortedEmails = [...emails].sort();
            expect(emails).toEqual(sortedEmails);
        });

        it("should require admin authentication", async () => {
            const server = getServer();

            // Create a regular (non-admin) user
            const regularUser = await authenticatedUser(server);

            // Try to access admin endpoint with regular user
            const response = await regularUser.get("/v1/admin/users");

            // Should return 401 Unauthorized
            expect(response.statusCode).toBe(403);
        });
    });

    describe("gET /v1/admin/users/:userId", () => {
        it("should return detailed user info by ID for admin", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server, {
                name: "Regular",
                surname: "User",
                email: `regular.user.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create an admin user
            const admin = await createAdminUser(server);

            // Get user by ID
            const response = await admin.get(`/v1/admin/users/${regularUser.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify user data - admin view should include complete information
            expect(body).toHaveProperty("id", regularUser.user.id);
            expect(body).toHaveProperty("name", regularUser.user.name);
            expect(body).toHaveProperty("surname", regularUser.user.surname);
            expect(body).toHaveProperty("email", regularUser.user.email);
            expect(body).toHaveProperty("roles");
            expect(body.roles).toContain("user");
        });
    });

    describe("pOST /v1/admin/users", () => {
        it("should allow admin to create a new user", async () => {
            const server = getServer();

            // Create an admin user
            const admin = await createAdminUser(server);

            // New user data
            const newUser = {
                name: "Created",
                surname: "ByAdmin",
                email: `created.by.admin.${randomUUID().substring(0, 8)}@example.com`,
                username: `admin_${randomUUID().substring(0, 8)}`,
                password: "SecurePassword123!",
            };

            // Create a new user as admin
            const response = await admin.post("/v1/admin/users", newUser);

            // Assert response
            expect(response.statusCode).toBe(201);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify created user data
            expect(body).toHaveProperty("id");
            expect(body).toHaveProperty("name", newUser.name);
            expect(body).toHaveProperty("surname", newUser.surname);
            expect(body).toHaveProperty("email", newUser.email);
            expect(body).toHaveProperty("roles");
            expect(body.roles).toContain("user");
        });
    });

    describe("pUT /v1/admin/users/:userId", () => {
        it("should allow admin to update a user", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Update data
            const updateData = {
                name: "Updated",
                surname: "ByAdmin",
            };

            // Update user as admin
            const response = await admin.put(`/v1/admin/users/${regularUser.user.id}`, updateData);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify updated user data
            expect(body).toHaveProperty("id", regularUser.user.id);
            expect(body).toHaveProperty("name", updateData.name);
            expect(body).toHaveProperty("surname", updateData.surname);
            expect(body).toHaveProperty("email", regularUser.user.email);
        });
    });

    describe("dELETE /v1/admin/users/:userId", () => {
        it("should allow admin to delete a user", async () => {
            const server = getServer();

            // Create a regular user to delete
            const regularUser = await authenticatedUser(server, {
                name: "Delete",
                surname: "Target",
                email: `delete.target.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create an admin user
            const admin = await createAdminUser(server);

            // Delete user as admin
            const response = await admin.delete(`/v1/admin/users/${regularUser.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(204);

            // Verify user is deleted
            const getResponse = await admin.get(`/v1/admin/users/${regularUser.user.id}`);
            expect(getResponse.statusCode).toBe(404);
        });
    });

    describe("role Management", () => {
        it("should allow admin to add admin role to user", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server, {
                name: "Regular",
                surname: "User",
                email: `regular.user.${randomUUID().substring(0, 8)}@example.com`,
            });

            // Create an admin user
            const admin = await createAdminUser(server);

            // Add admin role
            const response = await admin.post(`/v1/admin/users/${regularUser.user.id}/roles/admin`, {});

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify roles include admin
            expect(body).toHaveProperty("userId", regularUser.user.id);
            expect(body).toHaveProperty("roles");
            expect(body.roles).toContain("admin");
        });

        it("should allow admin to remove admin role from user", async () => {
            const server = getServer();

            // Create a regular user and make them admin
            const regularUser = await authenticatedUser(server, {
                name: "Regular",
                surname: "User",
                email: `regular.user.${randomUUID().substring(0, 8)}@example.com`,
            });
            await server.userService.addAdminRole(regularUser.user.id);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Remove admin role
            const response = await admin.delete(`/v1/admin/users/${regularUser.user.id}/roles/admin`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify roles no longer include admin
            expect(body).toHaveProperty("userId", regularUser.user.id);
            expect(body).toHaveProperty("roles");
            expect(body.roles).not.toContain("admin");
        });
    });
});
