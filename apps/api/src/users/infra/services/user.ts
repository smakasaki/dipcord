import type { FastifyInstance } from "fastify";

import fp from "fastify-plugin";

import type { ISessionRepository } from "#users/app/session-repo.js";
import type { IUserRepository } from "#users/app/user-repo.js";

import { PasswordService } from "#users/app/password-service.js";
import { SessionService } from "#users/app/session-service.js";
import { UserService } from "#users/app/user-service.js";
import { buildSessionConfig } from "#users/config/session-config.js";

import { SessionDao } from "../dao/session-dao.js";
import { UserDao } from "../dao/user-dao.js";

/**
 * Register user services
 */
export default fp(async (fastify: FastifyInstance) => {
    const userRepository: IUserRepository = new UserDao(fastify.db);
    const sessionRepository: ISessionRepository = new SessionDao(fastify.db);

    const passwordService = new PasswordService();
    const sessionConfig = buildSessionConfig();
    const sessionService = new SessionService(sessionRepository, sessionConfig);

    const userService = new UserService(
        passwordService,
        sessionService,
        userRepository,
    );

    fastify.decorate("sessionService", sessionService);
    fastify.decorate("userService", userService);

    fastify.log.info("User and session services registered");
});
