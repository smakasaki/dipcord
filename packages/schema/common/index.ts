import { Type } from "@sinclair/typebox";

export const UUID = Type.String({
    format: "uuid",
    description: "UUID identifier",
});

export const ID = Type.Object({
    id: UUID,
});

export * from "./pagination.js";
export * from "./query.js";
export * from "./responses.js";
