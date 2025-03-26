import type { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";

import { PasswordService } from "#users/app/password-service.js";
import { SessionService } from "#users/app/session-service.js";
import { UserService } from "#users/app/user-service.js";
import { buildSessionConfig } from "#users/config/session-config.js";

import { PasswordResetTokenDao } from "../dao/password-reset-dao.js";
import { SessionDao } from "../dao/session-dao.js";
import { UserDao } from "../dao/user-dao.js";

/**
 * User services plugin for Fastify
 *
 * This plugin registers all user-related services (user, session, authentication)
 * and makes them available throughout the application.
 */
const userServicesPlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.db) {
        throw new Error("Database not found. Make sure it is registered before the user services plugin.");
    }

    const userRepository = new UserDao(fastify.db);
    const sessionRepository = new SessionDao(fastify.db);
    const passwordResetTokenRepository = new PasswordResetTokenDao(fastify.db);

    const passwordService = new PasswordService();
    const sessionConfig = buildSessionConfig();
    const sessionService = new SessionService(sessionRepository, sessionConfig);

    const userService = new UserService(
        passwordService,
        sessionService,
        userRepository,
        passwordResetTokenRepository,
    );

    fastify.decorate("sessionService", sessionService);
    fastify.decorate("userService", userService);

    fastify.log.info("User and session services registered");
};

export default fp(userServicesPlugin, {
    name: "user-services",
    dependencies: ["database"],
});
