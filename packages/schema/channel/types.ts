import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";

export const ChannelRoleEnum = Type.Union([
    Type.Literal("owner"),
    Type.Literal("moderator"),
    Type.Literal("user"),
]);

export const ChannelPermissionsSchema = Type.Object({
    manage_members: Type.Boolean(),
    manage_messages: Type.Boolean(),
    manage_tasks: Type.Boolean(),
    manage_calls: Type.Boolean(),
    manage_polls: Type.Boolean(),
});

export const ChannelBase = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 50 }),
    description: Type.Optional(Type.String({ maxLength: 500 })),
    maxParticipants: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 50 })),
    accessSettings: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export const MemberBase = Type.Object({
    userId: UUID,
    role: ChannelRoleEnum,
    permissions: Type.Optional(ChannelPermissionsSchema),
});

export const InviteBase = Type.Object({
    email: Type.Optional(Type.String({ format: "email" })),
    expiresAt: Type.Optional(Type.String({ format: "date-time" })),
});
