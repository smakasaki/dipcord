import { z } from "zod";

export const Pagination = z.object({
    offset: z.coerce.number().default(0).optional(),
    limit: z.coerce.number().default(10).optional(),
});

export function PaginationResult<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        count: z.number().default(0),
        data: z.array(itemSchema),
    });
}
