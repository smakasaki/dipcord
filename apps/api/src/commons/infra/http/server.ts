import type { FastifyInstance } from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { Type } from "@sinclair/typebox";

import { errorHandler } from "#commons/infra/http/errors/index.js";
import { buildSessionConfig } from "#users/config/session-config.js";

/**
 * Build server with all components
 */
export default async function buildServer(app: FastifyInstance) {
    const { cookieName } = buildSessionConfig();
    // Register essential plugins
    app.register(sensible);
    app.register(cookie, {
        // eslint-disable-next-line node/no-process-env
        secret: process.env.COOKIE_SECRET || "supersecretcookiekeythatneedstobechanged",
    });
    app.register(cors, {
        // eslint-disable-next-line node/no-process-env
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
    });

    // Register Swagger documentation
    app.register(swagger, {
        openapi: {
            info: {
                title: "Dipcord API",
                description: "API documentation for Dipcord - A Microsoft Teams Clone",
                version: "1.0.0",
            },
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: cookieName,
                    },
                },
            },
        },
    });

    // Register Swagger UI
    app.register(swaggerUi, {
        routePrefix: "/documentation",
        uiConfig: {
            docExpansion: "list",
            deepLinking: true,
        },
    });

    // Register common module for database and utilities
    app.register(import("#commons/index.js"));

    // Register user module
    app.register(import("#users/index.js"));

    // Set global error handler
    app.setErrorHandler(errorHandler);

    // Add health check route
    app.get("/health", {
        schema: {
            tags: ["Health"],
            description: "Health check endpoint",
            response: {
                200: Type.Object({
                    status: Type.String(),
                    timestamp: Type.String({ format: "date-time" }),
                }),
            },
        },
    }, async () => {
        return {
            status: "healthy",
            timestamp: new Date().toISOString(),
        };
    });

    // Print routes on startup
    app.ready(() => {
        app.log.info("Server routes:");
        app.log.info(app.printRoutes());
    });
}
