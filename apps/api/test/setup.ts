/* eslint-disable node/no-process-env */
import console from "node:console";
/**
 * Global setup for all tests
 * This file is referenced in vitest.config.mts as a setup file
 * and will run before all tests.
 */
import { beforeAll } from "vitest";

/**
 * Set up environment variables for testing
 * Used by both unit and integration tests
 */
beforeAll(() => {
    console.log("🔧 Setting up global test environment");

    // Setup test environment variables
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "error";

    // Session config
    process.env.SESSION_COOKIE_NAME = "test_sid";
    process.env.SESSION_EXPIRATION_TIME = "3600000"; // 1 hour in ms
    process.env.SESSION_COOKIE_SECURE = "false";
    process.env.COOKIE_SECRET = "test_secret_key_for_testing_only";

    console.log("✅ Global test environment setup complete");
});
