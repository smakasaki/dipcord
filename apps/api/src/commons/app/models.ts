// Pagination parameters
export type Pagination = {
    offset: number;
    limit: number;
};

// Paginated result
export type PaginatedResult<T> = {
    count: number;
    data: T[];
};

// Sort direction
export type SortDirection = "asc" | "desc";

// Sort by specification
export type SortBy<T extends object> = Array<[keyof T, SortDirection?]>;
