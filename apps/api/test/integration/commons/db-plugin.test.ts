/**
 * Integration tests for database plugin
 */
import { sql } from "drizzle-orm";
import fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import databasePlugin, { testConnection } from "#commons/infra/plugins/database.js";

describe("databasePluginIntegration", () => {
    describe("databasePlugin basic functionality", () => {
        beforeEach(() => {
            vi.restoreAllMocks();
        });

        it("should register database connection with fastify", async () => {
            const app = fastify({
                logger: { level: "error" },
            });

            try {
                await app.register(databasePlugin);

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
                await app.register(databasePlugin);

                const endSpy = vi.fn();
                const originalEnd = app.db.$client.end;
                app.db.$client.end = endSpy;

                await app.close();

                expect(endSpy).toHaveBeenCalled();

                app.db.$client.end = originalEnd;
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
                await app.register(databasePlugin);

                const isConnected = await testConnection(app.db);

                expect(isConnected).toBe(true);
            }
            finally {
                await app.close();
            }
        });
    });
});
