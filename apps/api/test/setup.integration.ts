/* eslint-disable node/no-process-env */
import { afterAll, beforeAll } from "vitest";

import { closeGlobalTestDatabase, initGlobalTestDatabase } from "./helpers/db.js";
import { closeGlobalTestRedis, initGlobalTestRedis } from "./helpers/redis.js";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "error";

    process.env.SESSION_COOKIE_NAME = "test_sid";
    process.env.SESSION_EXPIRATION_TIME = "3600000"; // 1 hour
    process.env.SESSION_COOKIE_SECURE = "false";
    process.env.COOKIE_SECRET = "test_secret_key_for_testing_only";

    await Promise.all([
        initGlobalTestDatabase().catch((error: any) => {
            console.error("Error initializing test database:", error);
        }),
        initGlobalTestRedis().catch((error: any) => {
            console.error("Error initializing test Redis:", error);
        }),
    ]);
}, 90000);

afterAll(async () => {
    await Promise.all([
        closeGlobalTestDatabase(),
        closeGlobalTestRedis(),
    ]);
});
