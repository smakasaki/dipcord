import type { FastifyInstance } from "fastify";

import autoLoad from "@fastify/autoload";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Register user module
 */
export default async function (app: FastifyInstance) {
    // Register user services
    app.register(autoLoad, {
        dir: join(__dirname, "infra/services"),
        forceESM: true,
    });

    // Register user services
    app.register(autoLoad, {
        dir: join(__dirname, "infra/plugins"),
        forceESM: true,
        encapsulate: false,
    });

    // Register user routes
    app.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
    });
}
