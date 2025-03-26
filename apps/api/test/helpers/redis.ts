/**
 * Test Redis utilities for integration tests
 * Provides container initialization and state isolation
 */
import type { StartedRedisContainer } from "@testcontainers/redis";

import { RedisContainer } from "@testcontainers/redis";
import { createClient } from "redis";
import { afterEach, beforeEach } from "vitest";

export type TestRedisClient = ReturnType<typeof createClient>;

const TEST_REDIS_PASSWORD = "redis_test_password";

// Global container and connection state - shared across all integration tests
const globalState: {
    container?: StartedRedisContainer;
    client?: TestRedisClient;
} = {};

/**
 * Initialize Redis container for integration tests
 * Called from integration/setup.root.ts before all integration tests
 */
export async function initGlobalTestRedis() {
    if (globalState.container) {
        return globalState.client;
    }

    // Start Redis container
    globalState.container = await new RedisContainer("redis:7-alpine")
        .withExposedPorts(6379)
        .withPassword(TEST_REDIS_PASSWORD)
        .start();

    const host = globalState.container.getHost();
    const port = globalState.container.getMappedPort(6379);

    // Create Redis client
    globalState.client = createClient({
        socket: {
            host,
            port,
        },
        password: TEST_REDIS_PASSWORD,
    });

    // Connect to Redis
    await globalState.client.connect();

    // Log Redis connection details
    // console.log(`📦 Redis container started at ${host}:${port}`);

    return globalState.client;
}

/**
 * Close Redis connection and stop container
 * Called from integration/setup.root.ts after all integration tests
 */
export async function closeGlobalTestRedis() {
    // console.log("🔄 Shutting down global test Redis...");

    if (globalState.client) {
        await globalState.client.disconnect();
        globalState.client = undefined;
    }

    if (globalState.container) {
        await globalState.container.stop();
        globalState.container = undefined;
        // console.log("✓ Redis container stopped");
    }
}

/**
 * Setup hook to initialize Redis before tests in a test suite
 * Uses the global container but provides a clean Redis interface
 * Should only be used in integration tests
 */
export function setupTestRedis() {
    let redisClient: TestRedisClient | undefined;

    beforeEach(() => {
        try {
            // Check that Redis is initialized
            if (!globalState.client) {
                throw new Error(
                    "Redis not initialized. This test requires the Redis container to be running. "
                    + "Make sure this test file is in the integration test directory.",
                );
            }

            // Use the global Redis instance
            redisClient = globalState.client;
        }
        catch (error) {
            console.error("❌ Failed to access test Redis:", error);
            throw error;
        }
    });

    return {
        getRedis: () => {
            if (!redisClient) {
                throw new Error("Redis client not initialized");
            }
            return redisClient;
        },
    };
}

/**
 * Setup hook to clear Redis data between tests
 * This provides test isolation
 */
export function setupRedisIsolation() {
    afterEach(async () => {
        try {
            if (globalState.client) {
                // Clear all keys in the current database
                await globalState.client.flushDb();
            }
        }
        catch (error) {
            console.error("❌ Failed to clear Redis data:", error);
        }
    });
}

/**
 * Clears all keys with a specific prefix
 * Useful for isolating tests that use specific key patterns
 * @param prefix Key prefix to clean
 */
export async function clearKeysByPrefix(prefix: string) {
    if (!globalState.client) {
        throw new Error("Redis client not initialized");
    }

    // Find all keys with the given prefix
    const keys = await globalState.client.keys(`${prefix}*`);

    if (keys.length > 0) {
        // Delete all matching keys
        await globalState.client.del(keys);
    }
}

/**
 * Get test Redis client for direct use in tests
 * Only available in integration tests after Redis is initialized
 */
export const testRedis = {
    get: () => {
        if (!globalState.client) {
            throw new Error(
                "Redis client not initialized. This utility can only be used in integration tests. "
                + "Make sure this is imported in an integration test file.",
            );
        }
        return globalState.client;
    },
};
