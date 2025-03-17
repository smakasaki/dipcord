/**
 * Test database utilities for integration tests
 * Provides container initialization and transaction isolation
 */
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterEach, beforeEach } from "vitest";

import * as schema from "#db/schema/index.js";

export type TestDatabase = ReturnType<typeof createTestDatabase>;

const TEST_DB_NAME = "dipcord_test";
const TEST_DB_USER = "postgres";
const TEST_DB_PASSWORD = "postgres";

// Global container and connection state - shared across all integration tests
const globalState: {
    container?: StartedPostgreSqlContainer;
    pool?: pg.Pool;
    db?: ReturnType<typeof createTestDatabase>;
} = {};

// Thread-local transaction state
const transactionState: {
    client?: pg.PoolClient;
} = {};

/**
 * Create a properly typed test database instance
 */
function createTestDatabase(pool: pg.Pool) {
    return drizzle(pool, { schema });
}

/**
 * Initialize PostgreSQL container for integration tests
 * Called from integration/setup.root.ts before all integration tests
 */
export async function initGlobalTestDatabase() {
    if (globalState.container) {
        return globalState.db;
    }

    console.log("🚀 Starting PostgreSQL container for integration tests...");

    globalState.container = await new PostgreSqlContainer()
        .withDatabase(TEST_DB_NAME)
        .withUsername(TEST_DB_USER)
        .withPassword(TEST_DB_PASSWORD)
        .withExposedPorts(5432)
        .start();

    const host = globalState.container.getHost();
    const port = globalState.container.getMappedPort(5432);

    console.log(`📦 PostgreSQL container started at ${host}:${port}`);

    globalState.pool = new pg.Pool({
        host,
        port,
        user: TEST_DB_USER,
        password: TEST_DB_PASSWORD,
        database: TEST_DB_NAME,
        max: 10, // Increase connection pool to handle parallel tests
    });

    globalState.db = createTestDatabase(globalState.pool);

    // Run migrations only once
    await migrate(globalState.db, { migrationsFolder: "./src/db/migrations" });
    console.log("✓ Database migrations completed");

    return globalState.db;
}

/**
 * Close database connection and stop container
 * Called from integration/setup.root.ts after all integration tests
 */
export async function closeGlobalTestDatabase() {
    console.log("🔄 Shutting down global test database...");

    if (globalState.pool) {
        await globalState.pool.end();
        globalState.pool = undefined;
    }

    if (globalState.container) {
        await globalState.container.stop();
        globalState.container = undefined;
        console.log("✓ PostgreSQL container stopped");
    }
}

/**
 * Setup hook to initialize database before tests in a test suite
 * Uses the global container but provides a clean database interface
 * Should only be used in integration tests
 */
export function setupTestDatabase() {
    let dbInstance: TestDatabase | undefined;

    beforeEach(() => {
        try {
            // Check that the database is initialized
            if (!globalState.db) {
                throw new Error(
                    "Database not initialized. This test requires the database container to be running. "
                    + "Make sure this test file is in the integration test directory.",
                );
            }

            // Use the global database instance
            dbInstance = globalState.db;
        }
        catch (error) {
            console.error("❌ Failed to access test database:", error);
            throw error;
        }
    });

    return {
        getDb: () => {
            if (!dbInstance) {
                throw new Error("Database not initialized");
            }
            return dbInstance;
        },
    };
}

/**
 * Setup hook to:
 * 1. Truncate all tables before each test
 * 2. Start a transaction before each test
 * 3. Roll back the transaction after each test
 *
 * This provides complete test isolation with speed
 */
export function setupTestTransaction() {
    beforeEach(async () => {
        try {
            const db = globalState.db;
            if (!db || !globalState.pool) {
                throw new Error(
                    "Database not initialized. This test requires the database container to be running. "
                    + "Make sure this test file is in the integration test directory.",
                );
            }

            // First truncate all tables to start with a clean state
            await truncateAllTables(db);

            // Then get a client for the transaction
            transactionState.client = await globalState.pool.connect();

            // Start a transaction
            await transactionState.client.query("BEGIN");
            console.log("🔄 Started test transaction");
        }
        catch (error) {
            console.error("❌ Failed to setup test transaction:", error);
            throw error;
        }
    });

    afterEach(async () => {
        try {
            if (transactionState.client) {
                // Roll back the transaction
                await transactionState.client.query("ROLLBACK");
                console.log("↩️ Rolled back test transaction");

                // Release the client back to the pool
                transactionState.client.release();
                transactionState.client = undefined;
            }
        }
        catch (error) {
            console.error("❌ Failed to roll back transaction:", error);
        }
    });
}

/**
 * Clean up test database by truncating all tables
 * Executed before each test to ensure a clean state
 */
export async function truncateAllTables(db: TestDatabase) {
    try {
        const tablesResult = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);

        const tables = tablesResult.rows
            .map((row: any) => row.table_name)
            .join(", ");

        if (tables.length > 0) {
            await db.execute(sql`
                DO $$ 
                BEGIN 
                  EXECUTE 'TRUNCATE TABLE ' || '${sql.raw(tables)}' || ' RESTART IDENTITY CASCADE'; 
                END $$;
            `);
            console.log(`🧹 Truncated tables: ${tables}`);
        }
    }
    catch (error) {
        console.error("❌ Failed to truncate tables:", error);
        throw error;
    }
}

/**
 * Export database getter for direct use in tests
 * Only available in integration tests after database is initialized
 */
export const testDb = {
    get: () => {
        if (!globalState.db) {
            throw new Error(
                "Database not initialized. This utility can only be used in integration tests. "
                + "Make sure this is imported in an integration test file.",
            );
        }
        return globalState.db;
    },
};
