import { z } from "zod";

import { UUID } from "../common/index.js";

export const ChannelRoleEnum = z.enum([
    "owner",
    "moderator",
    "user",
]);

export const ChannelPermissionsSchema = z.object({
    manage_members: z.boolean(),
    manage_messages: z.boolean(),
    manage_tasks: z.boolean(),
    manage_calls: z.boolean(),
    manage_polls: z.boolean(),
});

export const ChannelBase = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    maxParticipants: z.number().min(1).max(50).default(50).optional(),
    accessSettings: z.record(z.string(), z.any()).optional(),
});

export const MemberBase = z.object({
    userId: UUID,
    role: ChannelRoleEnum,
    permissions: ChannelPermissionsSchema.optional(),
});

export const InviteBase = z.object({
    email: z.string().email().optional(),
    expiresAt: z.string().datetime().optional(),
});
