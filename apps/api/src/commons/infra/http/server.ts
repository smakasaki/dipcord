// apps/api/src/commons/infra/http/server.ts

import type { FastifyInstance } from "fastify";

import { PublicUserProfileResponse, UserResponse } from "@dipcord/schema";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
    createJsonSchemaTransformObject,
    jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { z } from "zod";

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

    // Register Swagger documentation for regular API
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
        transform: jsonSchemaTransform,
        transformObject: createJsonSchemaTransformObject({
            schemas: {
                // Register your schema references here for OpenAPI
                UserResponse,
                PublicUserProfileResponse,
                // Add more schemas as needed
            },
        }),
    });

    // Register Swagger UI for API
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

    app.register(import("#commons/infra/plugins/websockets.js"));

    // Register channel module
    app.register(import("#channels/index.js"));

    // Register chat module
    app.register(import("#chat/index.js"));

    // Register task module
    app.register(import("#tasks/index.js"));

    // Set global error handler
    app.setErrorHandler(errorHandler);

    // Add health check route
    app.get("/health", {
        schema: {
            tags: ["Health"],
            description: "Health check endpoint",
            response: {
                200: z.object({
                    status: z.string(),
                    timestamp: z.string().datetime(),
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
