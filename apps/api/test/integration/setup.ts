/**
 * Setup for integration tests using TestContainers
 * Creates a test server with a containerized database connection
 */
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastify from "fastify";
import { afterAll, beforeAll } from "vitest";

import { errorHandler } from "#commons/infra/http/errors/index.js";
import databasePlugin from "#commons/infra/plugins/database.js";
import authPlugin from "#users/infra/plugins/auth.js";
import authRoutes from "#users/infra/routes/v1/auth.js";
import usersRoutes from "#users/infra/routes/v1/users.js";
import userServicesPlugin from "#users/infra/services/user.js";

import { setupTestDatabase, setupTestTransaction, testDb } from "../helpers/db.js";

// Global server instance
let server: FastifyInstance;

/**
 * Create a test server with simplified setup
 */
export async function createTestServer(): Promise<FastifyInstance> {
    try {
        // Create Fastify instance with minimal logging
        const app = fastify({
            logger: {
                level: "error",
            },
        }).withTypeProvider<TypeBoxTypeProvider>();

        // Set up core plugins in a more direct way
        await app.register(sensible);
        await app.register(cookie, { secret: "test_secret_key" });
        await app.register(cors, { origin: true });

        // Set error handler
        app.setErrorHandler(errorHandler);

        // Register database
        await app.register(databasePlugin);

        // Register user services and auth
        await app.register(userServicesPlugin);
        await app.register(authPlugin);

        // Register routes
        await app.register(usersRoutes, { prefix: "/v1" });
        await app.register(authRoutes, { prefix: "/v1" });

        // Add basic health check
        app.get("/health", () => ({ status: "healthy" }));

        // Make sure server is ready
        await app.ready();

        // Log success
        console.log("Test server services:", {
            hasUserService: !!app.userService,
            hasSessionService: !!app.sessionService,
            hasDb: !!app.db,
        });

        return app;
    }
    catch (error) {
        console.error("Error creating test server:", error);
        throw error;
    }
}

/**
 * Setup function for API integration tests
 * Sets up a test server with database connection and transaction
 * @returns Test server instance
 */
export function setupIntegrationTest() {
    // Set up database with TestContainers
    setupTestDatabase();

    // Set up transaction for each test
    setupTestTransaction();

    // Create and start the server before tests
    beforeAll(async () => {
        try {
            console.log("Starting test server initialization");
            server = await createTestServer();
            console.log("Test server initialized successfully");
        }
        catch (error) {
            console.error("Failed to initialize test server:", error);
            throw error;
        }
    }, 120000); // Doubled timeout for server initialization

    // Close the server after tests
    afterAll(async () => {
        try {
            if (server) {
                await server.close();
                console.log("Test server closed");
            }
        }
        catch (error) {
            console.error("Failed to close test server:", error);
        }
    });

    // Return the server for tests to use
    return {
        getServer: () => server,
        getDb: () => testDb.get(),
    };
}
