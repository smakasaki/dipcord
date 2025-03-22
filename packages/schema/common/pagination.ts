import type { TSchema } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";

export const Pagination = Type.Object({
    offset: Type.Optional(Type.Number({ default: 0 })),
    limit: Type.Optional(Type.Number({ default: 10 })),
});

export function PaginationResult<T extends TSchema>(itemSchema: T) {
    return Type.Object({
        count: Type.Number({ default: 0 }),
        data: Type.Array(itemSchema),
    });
}
