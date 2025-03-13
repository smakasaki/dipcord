import type { SortBy, SortDirection } from "#commons/app/index.js";

// Sort string pattern, e.g. "field.asc" or just "field"
export type SortString = string;

/**
 * Decodes sort strings into SortBy format
 * Example: ["name.asc", "createdAt.desc"] => [["name", "asc"], ["createdAt", "desc"]]
 *
 * This is a generic function that works with any model type
 */
export function decodeSort<T extends Record<string, unknown>>(sort: SortString[]): SortBy<T> {
    return sort.map((s) => {
        const [field, order] = s.split(".");
        // We use type assertion here since we can't validate at compile time
        // whether the string is actually a key of T
        return [field as keyof T, (order as SortDirection) ?? "asc"];
    });
}

/**
 * Type-safe validation function that ensures sort fields are valid keys of the model
 *
 * @param sort Sort strings
 * @param validKeys Array of valid keys for the model
 * @returns Valid sort fields or default if none are valid
 */
export function validateSortFields<T extends Record<string, unknown>>(
    sort: SortString[],
    validKeys: Array<keyof T & string>,
    defaultSort: SortString[] = ["id.asc"],
): SortString[] {
    // Filter out invalid fields
    const validSortFields = sort.filter((s) => {
        const [field] = s.split(".");
        return validKeys.includes(field as keyof T & string);
    });

    return validSortFields.length > 0 ? validSortFields : defaultSort;
}
