/* eslint-disable node/no-process-env */
import { drizzle } from "drizzle-orm/node-postgres";
import { reset } from "drizzle-seed";
import pg from "pg";

import * as schema from "../src/db/schema/index.js";

// Database configuration
const dbConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "dipcord",
};

// Create a PostgreSQL connection
const pool = new pg.Pool(dbConfig);
const db = drizzle(pool);

async function main() {
    console.log("Starting database reset...");

    try {
    // Reset the database (truncate all tables)
        await reset(db, schema);
        console.log("Database reset completed successfully!");
    }
    catch (error) {
        console.error("Database reset failed:", error);
        process.exit(1);
    }
    finally {
    // Close the connection
        await pool.end();
    }
}

main().catch((error) => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
});
