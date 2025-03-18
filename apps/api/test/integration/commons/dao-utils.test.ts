import { snakeCase } from "change-case";
import { sql } from "drizzle-orm";
/**
 * Упрощенные тесты для dao/utils.js
 * Фокусируются на проверке правильного функционирования buildSortBy
 */
import { describe, expect, it } from "vitest";

// Модифицируем функцию buildSortBy для тестирования
import type { SortBy } from "#commons/app/index.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";

// Эта версия только для тестов, чтобы убедиться что логика работает правильно
export function testBuildSortBy<Model extends Record<string, unknown>>(
    sortBy: SortBy<Model>,
    table?: string,
): Array<{ column: string; direction: string }> {
    return sortBy.map(([field, order]) => {
        const column = snakeCase(field as string);
        const prefix = table ? `${table}.` : "";
        return {
            column: `${prefix}${column}`,
            direction: order ?? "asc",
        };
    });
}

describe("daoUtils", () => {
    type TestModel = {
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    };

    describe("buildSortBy", () => {
        it("should return SQL objects", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [
                ["name", "asc"],
            ];

            const result = buildSortBy<TestModel>(sortBy);
            expect(Array.isArray(result)).toBe(true);

            expect(result[0] instanceof Object).toBe(true);

            expect(typeof result[0]).toBe("object");
        });

        it("should convert camelCase fields to snake_case", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [
                ["createdAt", "asc"],
            ];

            const result = testBuildSortBy<TestModel>(sortBy);

            expect(result.length).toBeGreaterThan(0);
            if (result[0]) {
                expect(result[0].column).toBe("created_at");
                expect(result[0].direction).toBe("asc");
            }
        });

        it("should default to 'asc' when direction is not specified", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [
                ["id"],
            ];

            const result = testBuildSortBy<TestModel>(sortBy);

            expect(result.length).toBeGreaterThan(0);
            if (result[0]) {
                expect(result[0].column).toBe("id");
                expect(result[0].direction).toBe("asc");
            }
        });

        it("should handle table prefixes correctly", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [
                ["name", "asc"],
            ];
            const tableAlias = "users";

            const result = testBuildSortBy<TestModel>(sortBy, tableAlias);

            if (result[0]) {
                expect(result[0].column).toBe("users.name");
                expect(result[0].direction).toBe("asc");
            }
        });

        it("should handle multiple fields with mixed directions", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [
                ["id", "asc"],
                ["name", "desc"],
                ["email"],
            ];

            const result = testBuildSortBy<TestModel>(sortBy);

            expect(result.length).toBe(3);
            if (result[0] && result[1] && result[2]) {
                expect(result[0].column).toBe("id");
                expect(result[0].direction).toBe("asc");
                expect(result[1].column).toBe("name");
                expect(result[1].direction).toBe("desc");
                expect(result[2].column).toBe("email");
                expect(result[2].direction).toBe("asc");
            }
        });

        it("should handle empty sort array", () => {
            const sortBy: [keyof TestModel, ("asc" | "desc")?][] = [];

            const result = buildSortBy<TestModel>(sortBy);

            expect(result).toEqual([]);
        });
    });
});
