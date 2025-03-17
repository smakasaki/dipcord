/* eslint-disable node/no-process-env */
import { beforeAll } from "vitest";

beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "error";

    process.env.SESSION_COOKIE_NAME = "test_sid";
    process.env.SESSION_EXPIRATION_TIME = "3600000";
    process.env.SESSION_COOKIE_SECURE = "false";
    process.env.COOKIE_SECRET = "test_secret_key_for_testing_only";
});
