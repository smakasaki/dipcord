import { z } from "zod";

export const UUID = z.string().uuid().describe("UUID identifier");

export const ID = z.object({
    id: UUID,
});

export * from "./pagination.js";
export * from "./query.js";
export * from "./responses.js";
