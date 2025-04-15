import { z } from "zod";

import { Pagination } from "./pagination.js";

export const SortQuery = z.object({
    sort: z.union([
        z.string(),
        z.array(
            z.union([
                z.string(),
                z.string().regex(/^.+\.(asc|desc)$/),
            ]),
        ),
    ])
        .transform(val => Array.isArray(val) ? val : [val])
        .default(["createdAt.desc"])
        .optional(),
});

export const SearchQuery = z.object({
    query: z.string().min(1).optional(),
});

export const FilterQuery = z.object({
    filter: z.record(z.string(), z.any()).optional(),
});

export const FullQuery = Pagination.merge(SortQuery).merge(SearchQuery).merge(FilterQuery);
