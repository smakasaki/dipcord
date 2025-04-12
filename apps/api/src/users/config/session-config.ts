/* eslint-disable node/no-process-env */

import { z } from "zod";

import type { SessionConfig } from "#users/app/session-service.js";

// Session configuration schema
const SessionConfigSchema = z.object({
    cookieName: z.string(),
    expirationTime: z.number(),
    path: z.string(),
    domain: z.string().optional(),
    secure: z.boolean(),
    httpOnly: z.boolean(),
    sameSite: z.union([
        z.literal("strict"),
        z.literal("lax"),
        z.literal("none"),
    ]),
});

/**
 * Build session configuration from environment variables
 * @returns Session configuration
 * @throws Error if configuration is invalid
 */
export function buildSessionConfig(): SessionConfig {
    // Get configuration from environment variables or use defaults
    const config: SessionConfig = {
        cookieName: process.env.SESSION_COOKIE_NAME || "sid",
        expirationTime: Number.parseInt(process.env.SESSION_EXPIRATION_TIME || "604800000", 10), // 7 days in ms
        path: process.env.SESSION_COOKIE_PATH || "/",
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
        secure: process.env.SESSION_COOKIE_SECURE !== "false",
        httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== "false",
        sameSite: (process.env.SESSION_COOKIE_SAME_SITE || "strict") as "strict" | "lax" | "none",
    };

    // Validate configuration
    const validationResult = SessionConfigSchema.safeParse(config);
    if (validationResult.success) {
        return config;
    }

    // Throw error if configuration is invalid
    throw new Error(
        `Invalid session configuration: ${JSON.stringify(validationResult.error.format())}`,
    );
}
