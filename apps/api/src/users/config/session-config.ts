/* eslint-disable node/no-process-env */
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import type { SessionConfig } from "#users/app/session-service.js";

// Session configuration schema
const SessionConfigSchema = Type.Object({
    cookieName: Type.String(),
    expirationTime: Type.Number(),
    path: Type.String(),
    domain: Type.Optional(Type.String()),
    secure: Type.Boolean(),
    httpOnly: Type.Boolean(),
    sameSite: Type.Union([
        Type.Literal("strict"),
        Type.Literal("lax"),
        Type.Literal("none"),
    ]),
});

// Compiler for validation
const SchemaCompiler = TypeCompiler.Compile(SessionConfigSchema);

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
    if (SchemaCompiler.Check(config)) {
        return config;
    }

    // Throw error if configuration is invalid
    throw new Error(
        `Invalid session configuration: ${JSON.stringify([...SchemaCompiler.Errors(config)])}`,
    );
}
