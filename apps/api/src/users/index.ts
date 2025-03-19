import type { FastifyInstance } from "fastify";

import autoLoad from "@fastify/autoload";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import adminAuthPlugin from "./infra/plugins/admin-auth.js";
import authPlugin from "./infra/plugins/auth.js";

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

    await app.register(authPlugin);
    await app.register(adminAuthPlugin);
    await app.register(import("./infra/plugins/oauth.js"));
    // await app.register(autoLoad, {
    //     dir: join(__dirname, "infra/plugins"),
    //     forceESM: true,
    //     encapsulate: false,
    //     ignorePattern: /(auth|admin-auth)/,
    // });

    // Register user routes
    app.register(autoLoad, {
        dir: join(__dirname, "infra/routes"),
        options: { prefix: "" },
        forceESM: true,
        ignorePattern: /admin/,
    });

    app.register(import("./infra/routes/v1/admin/index.js"), {
        prefix: "/v1/admin",
    });
}
