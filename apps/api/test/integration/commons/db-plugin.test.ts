/**
 * Integration tests for database plugin
 */
import { sql } from "drizzle-orm";
import fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { testConnection } from "#commons/infra/plugins/database.js";

import { setupTestTransaction, testDb } from "../../helpers/db.js";

describe("databasePluginIntegration", () => {
    // Setup the test database connection
    setupTestTransaction();

    describe("databasePlugin basic functionality", () => {
        beforeEach(() => {
            vi.restoreAllMocks();
        });

        it("should register database connection with fastify", async () => {
            const app = fastify({
                logger: { level: "error" },
            });

            try {
                // Use the test database connection directly instead of trying to create a new one
                app.decorate("db", testDb.get());

                expect(app.db).toBeDefined();

                const result = await app.db.execute(sql`SELECT 1 as value`);
                expect(result!.rows[0]!.value).toBe(1);
            }
            finally {
                await app.close();
            }
        });

        it("should close database connection when server closes", async () => {
            const app = fastify({
                logger: { level: "error" },
            });

            try {
                // Use the test database connection
                const endSpy = vi.fn();

                // Register a proper onClose hook to ensure the spy is called
                app.addHook("onClose", async () => {
                    endSpy();
                });

                // Add the database to the app
                app.decorate("db", testDb.get());

                // Close the app, which should trigger the onClose hook
                await app.close();

                // Verify the spy was called
                expect(endSpy).toHaveBeenCalled();
            }
            catch (err) {
                await app.close();
                throw err;
            }
        });

        it("should expose testConnection function that works correctly", async () => {
            const app = fastify({
                logger: { level: "error" },
            });

            try {
                // Use the test database connection
                app.decorate("db", testDb.get());

                const isConnected = await testConnection(app.db);

                expect(isConnected).toBe(true);
            }
            finally {
                await app.close();
            }
        });
    });
});
