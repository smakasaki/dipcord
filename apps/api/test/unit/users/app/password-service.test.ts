/**
 * Unit tests for PasswordService
 */
import { describe, expect, it } from "vitest";

import { PasswordService } from "#users/app/password-service.js";

describe("passwordService", () => {
    const passwordService = new PasswordService();
    const testPassword = "SecurePassword123!";

    describe("generateHash", () => {
        it("should generate a hash and salt for a password", () => {
            const result = passwordService.generateHash(testPassword);

            // Check structure
            expect(result).toHaveProperty("hash");
            expect(result).toHaveProperty("salt");

            // Check hash and salt are non-empty strings
            expect(typeof result.hash).toBe("string");
            expect(typeof result.salt).toBe("string");
            expect(result.hash.length).toBeGreaterThan(0);
            expect(result.salt.length).toBeGreaterThan(0);
        });

        it("should generate different hashes for the same password with different salts", () => {
            const result1 = passwordService.generateHash(testPassword);
            const result2 = passwordService.generateHash(testPassword);

            // Different salts and hashes should be generated each time
            expect(result1.salt).not.toBe(result2.salt);
            expect(result1.hash).not.toBe(result2.hash);
        });
    });

    describe("compare", () => {
        it("should return true for a matching password and hash", () => {
            // Generate a hash for the test password
            const { hash, salt } = passwordService.generateHash(testPassword);

            // Verify the password matches
            const result = passwordService.compare(testPassword, hash, salt);
            expect(result).toBe(true);
        });

        it("should return false for a non-matching password", () => {
            // Generate a hash for the test password
            const { hash, salt } = passwordService.generateHash(testPassword);

            // Verify a different password doesn't match
            const wrongPassword = "DifferentPassword456!";
            const result = passwordService.compare(wrongPassword, hash, salt);
            expect(result).toBe(false);
        });

        it("should consistently validate the same password with the same salt", () => {
            // Generate a hash for the test password
            const { hash, salt } = passwordService.generateHash(testPassword);

            // Verify the password multiple times
            expect(passwordService.compare(testPassword, hash, salt)).toBe(true);
            expect(passwordService.compare(testPassword, hash, salt)).toBe(true);
            expect(passwordService.compare(testPassword, hash, salt)).toBe(true);
        });
    });
});
