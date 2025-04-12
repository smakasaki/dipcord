import { z } from "zod";

export const UserRoleEnum = z.enum(["user", "admin"]);

export const UserBase = z.object({
    name: z.string(),
    surname: z.string(),
    email: z.string().email(),
    username: z.string().min(3).max(20).regex(/^\w+$/),
});

export const PublicUserBase = z.object({
    name: z.string(),
    surname: z.string(),
    username: z.string(),
});

export const SessionBase = z.object({
    token: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    expiresAt: z.string().datetime(),
    lastUsedAt: z.string().datetime(),
    createdAt: z.string().datetime(),
});
