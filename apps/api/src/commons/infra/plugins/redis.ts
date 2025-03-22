import type { FastifyInstance } from "fastify";

import fp from "fastify-plugin";
import { createClient } from "redis";

import { buildRedisConfig } from "#commons/config/redis-config.js";

/**
 * Create Redis client with configuration
 * @returns Redis client instance
 */
export function createRedisClient() {
    const config = buildRedisConfig();

    const redis = createClient({
        socket: {
            host: config.host,
            port: config.port,
        },
        password: config.password,
        database: config.database,
    });

    return redis;
}

/**
 * Test Redis connection by pinging the server
 * @param redis Redis client
 * @returns True if connection is successful
 */
export async function testConnection(redis: ReturnType<typeof createRedisClient>): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (err) {
        return false;
    }
}

/**
 * Fastify plugin to add Redis connection
 */
export default fp(
    async (fastify: FastifyInstance) => {
        fastify.log.info("Connecting to Redis");

        const redis = createRedisClient();
        await redis.connect();
        const isConnected = await testConnection(redis);

        if (!isConnected) {
            fastify.log.error("Failed to connect to Redis");
            throw new Error("Redis connection failed");
        }

        fastify.decorate("redis", redis);
        fastify.log.info("Connected to Redis");
        fastify.addHook("onClose", async () => {
            fastify.log.info("Closing Redis connection");
            await redis.quit();
        });
    },
    { encapsulate: false },
);
