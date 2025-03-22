/**
 * Integration tests for password reset functionality
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticatedUser } from "../../helpers/auth.js";
import { setupApiTest } from "../setup.js";

describe("password reset API", () => {
    const { getServer } = setupApiTest();

    describe("pOST /v1/auth/password/reset-request", () => {
        it("should create a reset token for existing user", async () => {
            const server = getServer();

            // Create a user with known credentials
            const email = `reset.test.${randomUUID().substring(0, 8)}@example.com`;
            const password = "SecurePassword123!";

            const user = await server.userService.create({
                name: "Reset",
                surname: "Test",
                email,
                password,
            });

            // Request password reset
            const response = await server.inject({
                method: "POST",
                url: "/v1/auth/password/reset-request",
                payload: { email },
            });

            // Should return 204 (success with no content)
            expect(response.statusCode).toBe(204);

            // Verify token was created in the database
            // We need to access repository directly to check this
            const passwordResetTokenRepo = server.userService.getPasswordResetTokenRepository();
            const token = await passwordResetTokenRepo.findActiveByUserId(user.id);

            expect(token).toBeDefined();
            if (token) {
                expect(token.userId).toBe(user.id);
                expect(token.expiresAt).toBeInstanceOf(Date);
                expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now()); // Not expired
            }
        });

        it("should return 204 even for non-existent email (prevent enumeration)", async () => {
            const server = getServer();

            // Request password reset for non-existent email
            const nonExistentEmail = `nonexistent.${randomUUID()}@example.com`;

            const response = await server.inject({
                method: "POST",
                url: "/v1/auth/password/reset-request",
                payload: { email: nonExistentEmail },
            });

            // Should still return 204 to prevent email enumeration
            expect(response.statusCode).toBe(204);
        });
    });

    describe("pOST /v1/auth/password/reset", () => {
        it("should reset password with valid token", async () => {
            const server = getServer();

            // Create a user with known credentials
            const email = `pwd.reset.${randomUUID().substring(0, 8)}@example.com`;
            const oldPassword = "OldPassword123!";
            const newPassword = "NewPassword456!";

            const user = await server.userService.create({
                name: "Password",
                surname: "Reset",
                email,
                password: oldPassword,
            });

            // Create a reset token manually
            const resetToken = await server.userService.createPasswordResetToken(user.id);

            // Reset the password
            const resetResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/password/reset",
                payload: {
                    token: resetToken,
                    password: newPassword,
                },
            });

            // Should return 204 (success with no content)
            expect(resetResponse.statusCode).toBe(204);

            // Verify old password no longer works
            const oldLoginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: { email, password: oldPassword },
            });
            expect(oldLoginResponse.statusCode).toBe(401);

            // Verify new password works
            const newLoginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: { email, password: newPassword },
            });
            expect(newLoginResponse.statusCode).toBe(200);
        });

        it("should reject invalid reset token", async () => {
            const server = getServer();

            // Try to reset password with invalid token
            const resetResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/password/reset",
                payload: {
                    token: "invalid-token",
                    password: "NewPassword456!",
                },
            });

            // Should return 400 (bad request)
            expect(resetResponse.statusCode).toBe(400);

            // Verify error message
            const body = JSON.parse(resetResponse.body);
            expect(body).toHaveProperty("message", "Invalid or expired token");
        });
    });

    describe("pOST /v1/auth/password/change", () => {
        it("should change password for authenticated user", async () => {
            const server = getServer();

            // Create a user with authentication
            const oldPassword = "CurrentPassword123!";
            const newPassword = "NewPassword456!";

            const auth = await authenticatedUser(server, {
                password: oldPassword,
            });

            // Change password
            const changeResponse = await auth.post("/v1/auth/password/change", {
                currentPassword: oldPassword,
                newPassword,
            });

            // Should return 204 (success with no content)
            expect(changeResponse.statusCode).toBe(204);

            // Verify old password no longer works
            const oldLoginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email: auth.user.email,
                    password: oldPassword,
                },
            });
            expect(oldLoginResponse.statusCode).toBe(401);

            // Verify new password works
            const newLoginResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/login",
                payload: {
                    email: auth.user.email,
                    password: newPassword,
                },
            });
            expect(newLoginResponse.statusCode).toBe(200);
        });

        it("should reject incorrect current password", async () => {
            const server = getServer();

            // Create a user with authentication
            const password = "CurrentPassword123!";

            const auth = await authenticatedUser(server, {
                password,
            });

            // Try to change password with incorrect current password
            const changeResponse = await auth.post("/v1/auth/password/change", {
                currentPassword: "WrongPassword123!",
                newPassword: "NewPassword456!",
            });

            // Should return 401 (unauthorized)
            expect(changeResponse.statusCode).toBe(401);

            // Verify error message
            const body = JSON.parse(changeResponse.body);
            expect(body).toHaveProperty("message", "Current password is incorrect");
        });

        it("should require authentication", async () => {
            const server = getServer();

            // Try to change password without authentication
            const changeResponse = await server.inject({
                method: "POST",
                url: "/v1/auth/password/change",
                payload: {
                    currentPassword: "CurrentPassword123!",
                    newPassword: "NewPassword456!",
                },
            });

            // Should return 401 (unauthorized)
            expect(changeResponse.statusCode).toBe(401);
        });
    });
});
