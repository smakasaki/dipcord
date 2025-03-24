import type { FastifyPluginAsync } from "fastify";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import fp from "fastify-plugin";
import pg from "pg";

import { ConnectionError } from "#commons/app/errors.js";
import { buildDbConfig } from "#commons/config/db-config.js";
import * as schema from "#db/schema/index.js";

const { Pool } = pg;

export type Database = ReturnType<typeof createDbConnection>;

/**
 * Plugin to add database connection to Fastify instance
 *
 * This plugin creates a PostgreSQL connection pool and adds a Drizzle ORM
 * instance to the Fastify instance. It also tests the connection and handles
 * cleanup when the server closes.
 */
const databasePlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info("Connecting to database");

    try {
        const db = createDbConnection();
        const isConnected = await testConnection(db);

        if (!isConnected) {
            throw new ConnectionError("Failed to connect to database");
        }

        fastify.decorate("db", db);

        fastify.log.info("Connected to database");

        fastify.addHook("onClose", async () => {
            fastify.log.info("Closing database connection");
            await db.$client.end();
        });
    }
    catch (err) {
        fastify.log.error(err, "Database connection failed");
        throw new ConnectionError(`Database connection failed: ${(err as Error).message}`);
    }
};

/**
 * Create database connection
 *
 * @returns Drizzle ORM instance with schema
 */
export function createDbConnection() {
    const config = buildDbConfig();

    const pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
    });

    return drizzle(pool, { schema });
}

/**
 * Test database connection by executing a simple query
 *
 * @param db Database instance
 * @returns True if connection is successful
 */
export async function testConnection(db: Database): Promise<boolean> {
    try {
        await db.execute(sql`SELECT 1`);
        return true;
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (err) {
        return false;
    }
}

export default fp(databasePlugin, {
    name: "database",
});
