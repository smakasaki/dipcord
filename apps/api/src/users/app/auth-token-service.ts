import type { JWTPayload } from "jose";
import type { KeyObject } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";
import { createSecretKey } from "node:crypto";

import type { JwtConfig } from "../config/jwt-config.js";
import type { User } from "./models.js";

/**
 * Auth Token Service
 * Handles JWT token generation and verification
 */
export class AuthTokenService {
    private readonly secretKey: KeyObject;

    /**
     * Create a new AuthTokenService
     * @param jwtConfig JWT configuration
     */
    constructor(private readonly jwtConfig: JwtConfig) {
        this.secretKey = createSecretKey(this.jwtConfig.secretKey, "utf-8");
    }

    /**
     * Generate a JWT token for a user
     * @param user User to generate token for
     * @returns JWT token
     */
    async generateToken(user: User): Promise<string> {
    // Create payload without sensitive data
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
        };

        // Sign JWT with configuration
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setIssuer(this.jwtConfig.issuer)
            .setAudience(this.jwtConfig.audience)
            .setExpirationTime(this.jwtConfig.expirationTime)
            .sign(this.secretKey);
    }

    /**
     * Verify and decode a JWT token
     * @param token JWT token
     * @returns Decoded payload
     */
    async verifyToken(token: string): Promise<JWTPayload & Pick<User, "id" | "email" | "name" | "surname">> {
    // Verify JWT with configuration
        const { payload } = await jwtVerify(token, this.secretKey, {
            issuer: this.jwtConfig.issuer,
            audience: this.jwtConfig.audience,
        });

        return payload as JWTPayload & Pick<User, "id" | "email" | "name" | "surname">;
    }
}
