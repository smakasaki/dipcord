import type { FastifyInstance } from "fastify";

import autoLoad from "@fastify/autoload";
import fp from "fastify-plugin";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// const __filename = fileURLToPath(import.meta.url);
const __dirname = join(fileURLToPath(new URL(".", import.meta.url)), "infra");

// Register common plugins
export default fp(async (app: FastifyInstance) => {
    // Auto-load all plugins in the infrastructure/plugins directory
    app.register(autoLoad, {
        dir: join(__dirname, "plugins"),
        forceESM: true,
        encapsulate: false,
        ignorePattern: /websockets\.ts/,
    });
});
