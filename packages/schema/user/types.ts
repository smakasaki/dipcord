import { Type } from "@sinclair/typebox";

export const UserRoleEnum = Type.Union([
    Type.Literal("user"),
    Type.Literal("admin"),
]);

export const UserBase = Type.Object({
    name: Type.String(),
    surname: Type.String(),
    email: Type.String({ format: "email" }),
    username: Type.String({ minLength: 3, maxLength: 20, pattern: "^[a-zA-Z0-9_]+$" }),
});

export const PublicUserBase = Type.Object({
    name: Type.String(),
    surname: Type.String(),
    username: Type.String(),
});

export const SessionBase = Type.Object({
    token: Type.String(),
    ipAddress: Type.Optional(Type.String()),
    userAgent: Type.Optional(Type.String()),
    expiresAt: Type.String({ format: "date-time" }),
    lastUsedAt: Type.String({ format: "date-time" }),
    createdAt: Type.String({ format: "date-time" }),
});
