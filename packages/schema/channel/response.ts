import { Type } from "@sinclair/typebox";

import { ID, PaginationResult, StandardErrorResponses, UUID } from "../common/index.js";
import { ChannelBase, ChannelPermissionsSchema, InviteBase, MemberBase } from "./types.js";

export const ChannelResponse = Type.Intersect([
    ID,
    ChannelBase,
    Type.Object({
        createdAt: Type.String({ format: "date-time" }),
        updatedAt: Type.String({ format: "date-time" }),
    }),
]);

export const MemberResponse = Type.Intersect([
    ID,
    MemberBase,
    Type.Object({
        channelId: UUID,
        permissions: ChannelPermissionsSchema,
        joinedAt: Type.String({ format: "date-time" }),
        user: Type.Object({
            id: UUID,
            name: Type.String(),
            surname: Type.String(),
            username: Type.String(),
        }),
    }),
]);

export const InviteResponse = Type.Intersect([
    ID,
    InviteBase,
    Type.Object({
        channelId: UUID,
        createdByUserId: UUID,
        inviteCode: Type.String(),
        isUsed: Type.Boolean(),
        usedByUserId: Type.Optional(UUID),
        createdAt: Type.String({ format: "date-time" }),
    }),
]);

export const PaginatedChannelsResponse = PaginationResult(ChannelResponse);
export const PaginatedMembersResponse = PaginationResult(MemberResponse);
export const PaginatedInvitesResponse = PaginationResult(InviteResponse);

export const ChannelErrorResponses = StandardErrorResponses;
