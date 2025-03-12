import type { FastifyInstance } from "fastify";

import fp from "fastify-plugin";

import type { IUserRepository } from "#users/app/index.js";

import { AuthTokenService, PasswordService, UserService } from "#users/app/index.js";
import { buildJwtConfig } from "#users/config/jwt-config.js";

import { UserDao } from "../dao/user-dao.js";

/**
 * Register user services
 */
export default fp(async (fastify: FastifyInstance) => {
    // Create services
    const passwordService = new PasswordService();
    const jwtConfig = buildJwtConfig();
    const authTokenService = new AuthTokenService(jwtConfig);
    const userRepository: IUserRepository = new UserDao(fastify.db);

    // Create user service
    const userService = new UserService(
        passwordService,
        authTokenService,
        userRepository,
    );

    // Decorate fastify instance with user service
    fastify.decorate("userService", userService);

    // Log registration
    fastify.log.info("User service registered");
});
