import type { SortBy, SortDirection } from "#commons/app/index.js";

// Sort string pattern, e.g. "field.asc" or just "field"
type Sort<T extends string> = `${T}.${SortDirection}` | T;

/**
 * Decodes sort strings into SortBy format
 * Example: ["name.asc", "createdAt.desc"] => [["name", "asc"], ["createdAt", "desc"]]
 */
export function decodeSort<T extends string>(sort: Sort<T>[]): SortBy<Record<T, unknown>> {
    return sort.map((s) => {
        const [field, order] = s.split(".");
        return [field as any, (order as SortDirection) ?? "asc"];
    });
}
