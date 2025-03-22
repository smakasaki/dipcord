/**
 * Integration tests for admin authentication endpoints
 */
import { describe, expect, it } from "vitest";

import { authenticatedUser, createAdminUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("admin auth API", () => {
    const { getServer } = setupApiTest();

    describe("gET /v1/admin/auth/profile", () => {
        it("should return admin profile", async () => {
            const server = getServer();

            // Create an admin user
            const admin = await createAdminUser(server);

            // Get admin profile
            const response = await admin.get("/v1/admin/auth/profile");

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify profile data
            expect(body).toHaveProperty("id", admin.user.id);
            expect(body).toHaveProperty("name", admin.user.name);
            expect(body).toHaveProperty("surname", admin.user.surname);
            expect(body).toHaveProperty("email", admin.user.email);
            expect(body).toHaveProperty("roles");
            expect(body.roles).toContain("admin");
        });

        it("should deny access to non-admin users", async () => {
            const server = getServer();

            // Create a regular user (non-admin)
            const regularUser = await authenticatedUser(server);

            // Try to access admin profile endpoint
            const response = await regularUser.get("/v1/admin/auth/profile");

            // Assert response - should be unauthorized
            expect(response.statusCode).toBe(401);
        });
    });

    describe("gET /v1/admin/auth/sessions/:userId", () => {
        it("should list all sessions for a user", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Get sessions for the regular user
            const response = await admin.get(`/v1/admin/auth/sessions/${regularUser.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify sessions data
            expect(body).toHaveProperty("sessions");
            expect(Array.isArray(body.sessions)).toBe(true);
            expect(body.sessions.length).toBeGreaterThan(0);

            // Verify first session structure
            const session = body.sessions[0];
            expect(session).toHaveProperty("id");
            expect(session).toHaveProperty("token");
            expect(session).toHaveProperty("createdAt");
            expect(session).toHaveProperty("expiresAt");
            expect(session).toHaveProperty("lastUsedAt");
        });
    });

    describe("dELETE /v1/admin/auth/sessions/:sessionId", () => {
        it("should terminate a specific session", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Get sessions for the regular user
            const sessionsResponse = await admin.get(`/v1/admin/auth/sessions/${regularUser.user.id}`);
            const sessions = JSON.parse(sessionsResponse.body).sessions;
            const sessionId = sessions[0].id;

            // Terminate the session
            const response = await admin.delete(`/v1/admin/auth/sessions/${sessionId}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify response data
            expect(body).toHaveProperty("success", true);
            expect(body).toHaveProperty("message");
        });
    });

    describe("dELETE /v1/admin/auth/sessions/user/:userId", () => {
        it("should terminate all sessions for a user", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Terminate all sessions
            const response = await admin.delete(`/v1/admin/auth/sessions/user/${regularUser.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify response data
            expect(body).toHaveProperty("deletedCount");
            expect(body.deletedCount).toBeGreaterThanOrEqual(1);
            expect(body).toHaveProperty("message");

            // Verify sessions are actually deleted
            const sessionsResponse = await admin.get(`/v1/admin/auth/sessions/${regularUser.user.id}`);
            const sessions = JSON.parse(sessionsResponse.body).sessions;
            expect(sessions.length).toBe(0);
        });
    });

    describe("pOST /v1/admin/auth/force-password-reset/:userId", () => {
        it("should generate a password reset token", async () => {
            const server = getServer();

            // Create a regular user
            const regularUser = await authenticatedUser(server);

            // Create an admin user
            const admin = await createAdminUser(server);

            // Force password reset
            const response = await admin.post(`/v1/admin/auth/force-password-reset/${regularUser.user.id}`);

            // Assert response
            expect(response.statusCode).toBe(200);

            // Parse response body
            const body = JSON.parse(response.body);

            // Verify response data
            expect(body).toHaveProperty("success", true);
            expect(body).toHaveProperty("resetToken");
            expect(body).toHaveProperty("message");
            expect(typeof body.resetToken).toBe("string");
            expect(body.resetToken.length).toBeGreaterThan(0);
        });
    });
});
