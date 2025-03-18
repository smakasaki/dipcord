import type { SQL } from "drizzle-orm";

import { snakeCase } from "change-case";
import { sql } from "drizzle-orm";

import type { SortBy } from "#commons/app/index.js";

/**
 * Builds SQL ORDER BY expressions from SortBy configuration
 * following Drizzle ORM recommended patterns
 *
 * @param sortBy Sort configuration
 * @param table Optional table alias to prefix columns
 */
export function buildSortBy<Model extends Record<string, unknown>>(
    sortBy: SortBy<Model>,
    table?: string,
): SQL[] {
    return sortBy.map(([field, order]) => {
        const column = snakeCase(field as string);
        const prefixedColumn = table ? `${table}.${column}` : column;
        const direction = order ?? "asc";

        // Use sql`` template literal for better compatibility and testing
        return sql`${sql.raw(prefixedColumn)} ${sql.raw(direction)}`;
    });
}
