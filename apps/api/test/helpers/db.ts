import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import * as schema from "#db/schema/index.js";

export type TestDatabase = ReturnType<typeof createTestDatabase>;

const TEST_DB_NAME = "dipcord_test";
const TEST_DB_USER = "postgres";
const TEST_DB_PASSWORD = "postgres";

const state: {
    container?: any;
    pool?: pg.Pool;
    db?: ReturnType<typeof createTestDatabase>;
    client?: pg.PoolClient;
} = {};

/**
 * Create a properly typed test database instance
 */
function createTestDatabase(pool: pg.Pool) {
    return drizzle(pool, { schema });
}

/**
 * Initialize PostgreSQL container and database for tests
 * Creates a database connection to a container and runs migrations
 */
export async function initTestDatabase() {
    console.log("Starting PostgreSQL container...");

    state.container = await new PostgreSqlContainer()
        .withDatabase(TEST_DB_NAME)
        .withUsername(TEST_DB_USER)
        .withPassword(TEST_DB_PASSWORD)
        .withExposedPorts(5432)
        .start();

    const host = state.container.getHost();
    const port = state.container.getMappedPort(5432);

    console.log(`PostgreSQL container started at ${host}:${port}`);

    state.pool = new pg.Pool({
        host,
        port,
        user: TEST_DB_USER,
        password: TEST_DB_PASSWORD,
        database: TEST_DB_NAME,
    });

    state.db = createTestDatabase(state.pool);

    await migrate(state.db, { migrationsFolder: "./src/db/migrations" });

    console.log("Database migrations completed");

    return state.db;
}

/**
 * Close database connection and stop container
 */
export async function closeTestDatabase() {
    console.log("Shutting down test database...");

    if (state.pool) {
        await state.pool.end();
    }

    if (state.container) {
        await state.container.stop();
        console.log("PostgreSQL container stopped");
    }
}

/**
 * Setup hook to initialize database before all tests
 * and close it after all tests
 */
export function setupTestDatabase() {
    let dbInstance: TestDatabase | undefined;

    beforeAll(async () => {
        try {
            dbInstance = await initTestDatabase();
        }
        catch (error) {
            console.error("Failed to initialize test database:", error);
            throw error;
        }
    }, 120000); // Increased timeout for container startup

    afterAll(async () => {
        try {
            await closeTestDatabase();
        }
        catch (error) {
            console.error("Failed to close test database:", error);
        }
    });

    return {
        getDb: () => dbInstance || state.db as TestDatabase,
    };
}

/**
 * Setup hook to start a transaction before each test
 * and roll it back after each test
 */
export function setupTestTransaction() {
    beforeEach(async () => {
        try {
            if (state.pool) {
                state.client = await state.pool.connect();

                await state.client.query("BEGIN");

                if (state.db) {
                    await truncateAllTables(state.db);
                }
            }
        }
        catch (error) {
            console.error("Failed to start transaction:", error);
            throw error;
        }
    });

    afterEach(async () => {
        try {
            if (state.client) {
                await state.client.query("ROLLBACK");

                state.client.release();
                state.client = undefined;
            }
        }
        catch (error) {
            console.error("Failed to rollback transaction:", error);
        }
    });
}

/**
 * Clean up test database by truncating all tables
 * Usage: await truncateAllTables(db);
 */
export async function truncateAllTables(db: TestDatabase) {
    try {
        const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

        const tables = tablesResult.rows.map((row: any) => row.table_name).join(", ");

        if (tables.length > 0) {
            await db.execute(sql`
        DO $$ 
        BEGIN 
          EXECUTE 'TRUNCATE TABLE ' || '${sql.raw(tables)}' || ' RESTART IDENTITY CASCADE'; 
        END $$;
      `);
        }
    }
    catch (error) {
        console.error("Failed to truncate tables:", error);
        throw error;
    }
}

/**
 * Export database getter for tests
 */
export const testDb = {
    get: () => state.db as TestDatabase,
};
