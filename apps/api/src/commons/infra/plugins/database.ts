import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import fp from "fastify-plugin";
import pg from "pg";

import { buildDbConfig } from "#commons/config/db-config.js";
import * as schema from "#db/schema/index.js";

const { Pool } = pg;

// Create database connection
export function createDbConnection() {
    const config = buildDbConfig();

    // Create PostgreSQL connection pool
    const pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
    });

    // Create Drizzle ORM instance with schema
    return drizzle(pool, { schema });
}

/**
 * Test database connection by executing a simple query
 * @param db Database instance
 * @returns True if connection is successful
 */
export async function testConnection(db: Database) {
    try {
        // Execute a simple query to test connection
        await db.execute(sql`SELECT 1`);
        return true;
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (err) {
        return false;
    }
}

// Create Drizzle ORM type from schema
export type Database = ReturnType<typeof createDbConnection>;

// Fastify plugin to add database connection
export default fp(
    async (fastify) => {
        // Log database connection attempt
        fastify.log.info("Connecting to database");

        // Create database connection
        const db = createDbConnection();

        // Test connection
        const isConnected = await testConnection(db);

        if (!isConnected) {
            fastify.log.error("Failed to connect to database");
            throw new Error("Database connection failed");
        }

        // Add database to Fastify instance
        fastify.decorate("db", db);

        // Log successful connection
        fastify.log.info("Connected to database");

        // Close database connection when server closes
        fastify.addHook("onClose", async () => {
            fastify.log.info("Closing database connection");
            await db.$client.end();
        });
    },
    { encapsulate: false },
);
