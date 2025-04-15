/* eslint-disable node/no-process-env */
import { z } from "zod";

// Database configuration schema
const DatabaseConfigSchema = z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
});

// Database configuration type
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

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
    const validationResult = DatabaseConfigSchema.safeParse(config);
    if (validationResult.success) {
        return config;
    }

    // Throw error if configuration is invalid
    throw new Error(
        `Invalid database configuration: ${JSON.stringify(validationResult.error.format())}`,
    );
}
