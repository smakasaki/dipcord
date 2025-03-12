/* eslint-disable node/no-process-env */
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

// Database configuration schema
const DatabaseConfigSchema = Type.Object({
    host: Type.String(),
    port: Type.Number(),
    username: Type.String(),
    password: Type.String(),
    database: Type.String(),
});

// Compiler for validation
const SchemaCompiler = TypeCompiler.Compile(DatabaseConfigSchema);

// Database configuration type
export type DatabaseConfig = {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
};

// Build database configuration from environment variables
export function buildDbConfig(): DatabaseConfig {
    // Get configuration from environment variables
    const config = {
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: process.env.POSTGRES_DB || "dipcord",
    };

    // Add worker ID offset for tests
    // if (process.env.VITEST_WORKER_ID) {
    //     config.port += Number(process.env.VITEST_WORKER_ID);
    // }

    // Validate configuration
    if (SchemaCompiler.Check(config)) {
        return config;
    }

    // Throw error if configuration is invalid
    throw new Error(
        `Invalid database configuration: ${JSON.stringify([...SchemaCompiler.Errors(config)])}`,
    );
}
