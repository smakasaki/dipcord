/* eslint-disable node/no-process-env */
import { z } from "zod";

const RedisConfigSchema = z.object({
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
    database: z.number().optional(),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

/**
 * Build Redis configuration from environment variables
 * @returns Validated Redis configuration
 */
export function buildRedisConfig(): RedisConfig {
    const config = {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        database: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
    };

    const validationResult = RedisConfigSchema.safeParse(config);
    if (validationResult.success) {
        return config;
    }

    throw new Error(
        `Invalid Redis configuration: ${JSON.stringify(validationResult.error.format())}`,
    );
}
