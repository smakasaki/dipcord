/* eslint-disable node/no-process-env */
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

// JWT configuration schema
const JwtConfigSchema = Type.Object({
    issuer: Type.String(),
    audience: Type.String(),
    expirationTime: Type.String(),
    secretKey: Type.String(),
});

// Compiler for validation
const SchemaCompiler = TypeCompiler.Compile(JwtConfigSchema);

// JWT configuration type
export type JwtConfig = {
    issuer: string;
    audience: string;
    expirationTime: string;
    secretKey: string;
};

/**
 * Build JWT configuration from environment variables
 * @returns JWT configuration
 * @throws Error if configuration is invalid
 */
export function buildJwtConfig(): JwtConfig {
    // Get configuration from environment variables
    const config = {
        issuer: process.env.JWT_ISSUER || "dipcord",
        audience: process.env.JWT_AUDIENCE || "dipcord",
        expirationTime: process.env.JWT_EXPIRATION_TIME || "1h",
        secretKey: process.env.JWT_SECRET || "superSecretKey",
    };

    // Validate configuration
    if (SchemaCompiler.Check(config)) {
        return config;
    }

    // Throw error if configuration is invalid
    throw new Error(
        `Invalid JWT configuration: ${JSON.stringify([...SchemaCompiler.Errors(config)])}`,
    );
}
