/* eslint-disable node/no-process-env */
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

const RedisConfigSchema = Type.Object({
    host: Type.String(),
    port: Type.Number(),
    password: Type.Optional(Type.String()),
    database: Type.Optional(Type.Number()),
});

const SchemaCompiler = TypeCompiler.Compile(RedisConfigSchema);

export type RedisConfig = {
    host: string;
    port: number;
    password?: string;
    database?: number;
};

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

    if (SchemaCompiler.Check(config)) {
        return config;
    }

    throw new Error(
        `Invalid Redis configuration: ${JSON.stringify([...SchemaCompiler.Errors(config)])}`,
    );
}
