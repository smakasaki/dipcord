/* eslint-disable node/no-process-env */

import type {
    ZodTypeProvider,
} from "fastify-type-provider-zod";

import fastify from "fastify";
import {
    createJsonSchemaTransformObject,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";

import buildServer from "./commons/infra/http/server.js";

/**
 * Start the server
 */
async function start() {
    // Create fastify instance with logging
    const app = fastify({
        logger: {
            level: process.env.LOG_LEVEL || "info",
            transport: {
                target: "pino-pretty",
            },
            redact: {
                paths: ["req.headers.authorization", "[*].password"],
                censor: "***",
            },
        },
    });

    // Set Zod as the validator and serializer
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const appWithTypes = app.withTypeProvider<ZodTypeProvider>();

    try {
        // Register server components
        appWithTypes.register(buildServer);

        // Wait for server to be ready (plugins registered)
        await app.ready();

        // Get port from environment or default to 3001
        const port = Number(process.env.PORT) || 3001;

        // Start server
        await app.listen({
            port,
            host: "0.0.0.0",
        });

        app.log.info(`Server listening on port ${port}`);
    }
    catch (err) {
        app.log.error(err, "Server startup failed");

        // Close app to clean up resources
        try {
            await app.close();
        }
        catch (closeErr) {
            app.log.error(closeErr, "Error during server shutdown");
        }

        process.exit(1);
    }
}

// Start the server with proper error handling
start().catch((err) => {
    console.error("Fatal error during server startup:", err);
    process.exit(1);
});
