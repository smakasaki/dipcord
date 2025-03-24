import type { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";
import { createClient } from "redis";

import { ConnectionError } from "#commons/app/errors.js";
import { buildRedisConfig } from "#commons/config/redis-config.js";

export type RedisClient = ReturnType<typeof createRedisClient>;

/**
 * Redis plugin for Fastify
 *
 * This plugin creates and connects to Redis, adds it to the Fastify instance,
 * and handles proper lifecycle (connect/disconnect).
 */
const redisPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info("Connecting to Redis");

    try {
        const redis = createRedisClient();
        await redis.connect();

        const isConnected = await testConnection(redis);
        if (!isConnected) {
            throw new ConnectionError("Failed to connect to Redis");
        }

        fastify.decorate("redis", redis);
        fastify.log.info("Connected to Redis");

        fastify.addHook("onClose", async () => {
            fastify.log.info("Closing Redis connection");
            await redis.quit();
        });
    }
    catch (err) {
        fastify.log.error(err, "Redis connection failed");
        throw new ConnectionError(`Redis connection failed: ${(err as Error).message}`);
    }
};

/**
 * Create Redis client with configuration
 *
 * @returns Redis client instance
 */
export function createRedisClient() {
    const config = buildRedisConfig();

    return createClient({
        socket: {
            host: config.host,
            port: config.port,
        },
        password: config.password,
        database: config.database,
    });
}

/**
 * Test Redis connection by pinging the server
 *
 * @param redis Redis client
 * @returns True if connection is successful
 */
export async function testConnection(redis: RedisClient): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (err) {
        return false;
    }
}

export default fp(redisPlugin, {
    name: "redis",
});
