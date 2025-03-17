/* eslint-disable node/no-process-env */
/**
 * Global setup for tests
 *
 * This file is referenced in the vitest.config.mts file as a setup file
 * and will run before all tests.
 */
import { afterAll, beforeAll } from "vitest";

/**
 * Set up environment variables for testing
 */
beforeAll(() => {
    // Setup test environment variables
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "error";

    // We don't need to set database config
    // since we're using TestContainers which will provide these values dynamically

    // Session config
    process.env.SESSION_COOKIE_NAME = "test_sid";
    process.env.SESSION_EXPIRATION_TIME = "3600000"; // 1 hour in ms
    process.env.SESSION_COOKIE_SECURE = "false";
    process.env.COOKIE_SECRET = "test_secret_key_for_testing_only";

    console.log("Test environment setup complete");
});

/**
 * Clean up after all tests
 */
afterAll(() => {
    console.log("Test environment cleanup complete");
});
