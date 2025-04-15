/**
 * Setup for complete API integration tests
 * Creates a full test server with all components registered
 */
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastify from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { afterAll, afterEach, beforeAll } from "vitest";

import channelsRoutes from "#channels/infra/routes/v1/channels.js";
import channelServicesPlugin from "#channels/infra/services/channel.js";
import chatServicesPlugin from "#chat/infra/plugins/chat-service.js";
import messagesRoutes from "#chat/infra/routes/v1/messages.js";
import { errorHandler } from "#commons/infra/http/errors/index.js";
import websockets from "#commons/infra/plugins/websockets.js";
import adminAuth from "#users/infra/plugins/admin-auth.js";
import authPlugin from "#users/infra/plugins/auth.js";
import adminAuthRoutes from "#users/infra/routes/v1/admin/auth.js";
import adminUsersRoutes from "#users/infra/routes/v1/admin/users.js";
import authRoutes from "#users/infra/routes/v1/auth.js";
import usersRoutes from "#users/infra/routes/v1/users.js";
import userServicesPlugin from "#users/infra/services/user.js";

import { setupTestTransaction, testDb } from "../helpers/db.js";
import { setupRedisIsolation, testRedis } from "../helpers/redis.js";

/**
 * Create a complete test server with all components
 * Use this for full API tests when you need the entire application stack
 */
export async function createApiTestServer(): Promise<FastifyInstance> {
    try {
        // Create Fastify instance with minimal logging
        const app = fastify({
            logger: {
                level: "error",
                transport: {
                    target: "pino-pretty",
                    options: {
                        translateTime: false,
                        ignore: "pid,hostname",
                    },
                },
            },
        }).withTypeProvider<ZodTypeProvider>();

        // Register schema validation
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);

        // Set up core plugins
        await app.register(sensible);
        await app.register(cookie, { secret: "test_secret_key" });
        await app.register(cors, { origin: true });

        // Set error handler
        app.setErrorHandler(errorHandler);

        // Используем уже существующую БД, инициализированную в setup.integration.ts
        await app.register(fp((instance, _, done) => {
            instance.decorate("db", testDb.get());
            instance.log.info("Test database registered");
            done();
        }, { name: "database" }));

        await app.register(fp((instance, _, done) => {
            instance.decorate("redis", testRedis.get());
            instance.log.info("Test redis registered");
            done();
        }, { name: "redis" }));

        // Register services and plugins
        await app.register(userServicesPlugin);
        await app.register(authPlugin);
        await app.register(adminAuth);

        // Register routes
        await app.register(usersRoutes, { prefix: "/v1" });
        await app.register(adminUsersRoutes, { prefix: "/v1/admin/users" });

        await app.register(websockets);

        await app.register(authRoutes, { prefix: "/v1" });
        await app.register(adminAuthRoutes, { prefix: "/v1/admin/auth" });

        await app.register(channelServicesPlugin);
        await app.register(channelsRoutes, { prefix: "/v1/" });

        // Register chat services and routes
        await app.register(chatServicesPlugin);
        await app.register(messagesRoutes, { prefix: "/v1/" });

        // Add basic health check
        app.get("/health", () => ({ status: "healthy" }));

        // Make sure server is ready
        await app.ready();
        // console.log(app.printRoutes());

        return app;
    }
    catch (error) {
        console.error("❌ Error creating test API server:", error);
        throw error;
    }
}

/**
 * Setup function for API integration tests
 * Sets up a full test server with database connection and transaction isolation
 */
export function setupApiTest() {
    setupTestTransaction();
    setupRedisIsolation();

    // Server instance
    let server: FastifyInstance;

    // Create and start the server before tests
    beforeAll(async () => {
        try {
            server = await createApiTestServer();
        }
        catch (error) {
            console.error("❌ Failed to initialize test API server:", error);
            throw error;
        }
    }, 30000); // 30s timeout for server initialization

    // Cleanup for each test
    afterEach(async () => {
        // Any per-test cleanup needed for the server
    });

    // Close the server after tests
    afterAll(async () => {
        try {
            if (server) {
                await server.close();
            }
        }
        catch (error) {
            console.error("❌ Failed to close test API server:", error);
        }
    });

    // Return the server for tests to use
    return {
        getServer: () => server,
    };
}
