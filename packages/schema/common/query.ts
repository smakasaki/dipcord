import { Type } from "@sinclair/typebox";

import { Pagination } from "./pagination.js";

export const SortQuery = Type.Object({
    sort: Type.Optional(Type.Array(
        Type.Union([
            Type.String(),
            Type.String({ pattern: "^.+\\.(asc|desc)$" }),
        ]),
        { default: ["createdAt.desc"] },
    )),
});

export const SearchQuery = Type.Object({
    query: Type.Optional(Type.String({ minLength: 1 })),
});

export const FilterQuery = Type.Object({
    filter: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export const FullQuery = Type.Intersect([
    Pagination,
    SortQuery,
    SearchQuery,
    FilterQuery,
]);
