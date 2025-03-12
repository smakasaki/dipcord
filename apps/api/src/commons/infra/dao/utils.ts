import type { SQL } from "drizzle-orm";

import { snakeCase } from "change-case";
import { sql } from "drizzle-orm";

import type { SortBy } from "#commons/app/index.js";

/**
 * Builds SQL ORDER BY expressions from SortBy configuration
 * @param sortBy Sort configuration
 * @param table Optional table alias to prefix columns
 */
export function buildSortBy<Model extends Record<string, unknown>>(
    sortBy: SortBy<Model>,
    table?: string,
): SQL[] {
    return sortBy.map(([field, order]) => {
        const column = snakeCase(field as string);
        const prefix = table ? `${table}.` : "";
        return sql.raw(`${prefix}${column} ${order ?? "asc"}`);
    });
}
