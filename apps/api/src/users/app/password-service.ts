import { pbkdf2Sync, randomBytes } from "node:crypto";

import type { PasswordHashWithSalt } from "./models.js";

/**
 * Password Service
 * Handles password hashing, verification, and salt generation
 */
export class PasswordService {
    private readonly ITERATIONS = 10000;
    private readonly KEY_LENGTH = 64;
    private readonly DIGEST = "sha512";
    private readonly SALT_SIZE = 32;

    /**
     * Generate password hash with salt
     * @param password Plain text password
     * @returns Object containing hash and salt
     */
    generateHash(password: string): PasswordHashWithSalt {
        const salt = randomBytes(this.SALT_SIZE).toString("hex");
        return {
            salt,
            hash: this.hashPassword(password, salt),
        };
    }

    /**
     * Compare password with stored hash
     * @param password Plain text password to verify
     * @param hash Stored password hash
     * @param salt Salt used for hashing
     * @returns True if password matches hash
     */
    compare(password: string, hash: string, salt: string): boolean {
        return hash === this.hashPassword(password, salt);
    }

    /**
     * Hash password with salt
     * @param password Plain text password
     * @param salt Salt for hashing
     * @returns Hashed password
     */
    private hashPassword(password: string, salt: string): string {
        return pbkdf2Sync(
            password,
            salt,
            this.ITERATIONS,
            this.KEY_LENGTH,
            this.DIGEST,
        ).toString("hex");
    }
}
