/**
 * Setup for complete API integration tests
 * Creates a full test server with all components registered
 */
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastify from "fastify";
import { afterAll, afterEach, beforeAll } from "vitest";

import { errorHandler } from "#commons/infra/http/errors/index.js";
import authPlugin from "#users/infra/plugins/auth.js";
import authRoutes from "#users/infra/routes/v1/auth.js";
import usersRoutes from "#users/infra/routes/v1/users.js";
import userServicesPlugin from "#users/infra/services/user.js";

import { setupTestTransaction, testDb } from "../helpers/db.js";

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
        }).withTypeProvider<TypeBoxTypeProvider>();

        // Set up core plugins
        await app.register(sensible);
        await app.register(cookie, { secret: "test_secret_key" });
        await app.register(cors, { origin: true });

        // Set error handler
        app.setErrorHandler(errorHandler);

        // Используем уже существующую БД, инициализированную в setup.integration.ts
        app.decorate("db", testDb.get());

        // Register services and plugins
        await app.register(userServicesPlugin);
        await app.register(authPlugin);

        // Register routes
        await app.register(usersRoutes, { prefix: "/v1" });
        await app.register(authRoutes, { prefix: "/v1" });

        // Add basic health check
        app.get("/health", () => ({ status: "healthy" }));

        // Make sure server is ready
        await app.ready();

        console.log("🚀 Test API server initialized");

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
                console.log("✅ Test API server closed");
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
