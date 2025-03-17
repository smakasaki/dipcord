/**
 * Component testing helper
 * Creates focused Fastify instances with only selected plugins
 * For use in integration tests only
 */
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastify from "fastify";
import { afterEach, beforeEach } from "vitest";

import { errorHandler } from "#commons/infra/http/errors/index.js";
import authPlugin from "#users/infra/plugins/auth.js";
import userServicesPlugin from "#users/infra/services/user.js";

import { setupTestTransaction, testDb } from "./db.js";

export type ComponentPlugins = {
    database?: boolean;
    userServices?: boolean;
    auth?: boolean;
    routes?: {
        users?: boolean;
        auth?: boolean;
    };
};

/**
 * Create a minimal Fastify instance with only selected plugins
 * This allows testing components with minimal dependencies
 * For use in integration tests only
 */
export async function createFocusedComponent(options: ComponentPlugins = {}): Promise<FastifyInstance> {
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

        // Set up core plugins needed by all components
        await app.register(sensible);
        await app.register(cookie, { secret: "test_secret_key" });
        await app.register(cors, { origin: true });

        // Set error handler
        app.setErrorHandler(errorHandler);

        // Conditionally register plugins based on options
        if (options.database) {
            // Используем уже существующую БД, инициализированную в setup.integration.ts
            app.decorate("db", testDb.get());
        }

        // Register user services if needed
        if (options.userServices && options.database) {
            await app.register(userServicesPlugin);
        }

        // Register auth plugin if needed
        if (options.auth && options.userServices) {
            await app.register(authPlugin);
        }

        // Register routes if needed
        if (options.routes?.users) {
            const usersRoutes = await import("#users/infra/routes/v1/users.js");
            await app.register(usersRoutes.default, { prefix: "/v1" });
        }

        if (options.routes?.auth) {
            const authRoutes = await import("#users/infra/routes/v1/auth.js");
            await app.register(authRoutes.default, { prefix: "/v1" });
        }

        // Make sure server is ready
        await app.ready();

        return app;
    }
    catch (error) {
        console.error("❌ Error creating focused component:", error);
        throw error;
    }
}

/**
 * Setup for focused component testing
 * Creates a focused component with selected plugins and handles cleanup
 * For use in integration tests only
 */
export function setupComponentTest(options: ComponentPlugins = {}) {
    setupTestTransaction();

    let component: FastifyInstance;

    beforeEach(async () => {
        component = await createFocusedComponent(options);
    });

    afterEach(async () => {
        if (component) {
            await component.close();
        }
    });

    return {
        getComponent: () => component,
    };
}
