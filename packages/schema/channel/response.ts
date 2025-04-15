import { z } from "zod";

import { ID, PaginationResult, StandardErrorResponses, UUID } from "../common/index.js";
import { ChannelBase, ChannelPermissionsSchema, InviteBase, MemberBase } from "./types.js";

export const ChannelResponse = ID.extend({
    ...ChannelBase.shape,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const MemberResponse = ID.extend({
    ...MemberBase.shape,
    channelId: UUID,
    permissions: ChannelPermissionsSchema,
    joinedAt: z.string().datetime(),
    user: z.object({
        id: UUID,
        name: z.string(),
        surname: z.string(),
        username: z.string(),
    }),
});

export const InviteResponse = ID.extend({
    ...InviteBase.shape,
    channelId: UUID,
    createdByUserId: UUID,
    inviteCode: z.string(),
    isUsed: z.boolean(),
    usedByUserId: UUID.nullable(),
    expiresAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
});

export const PaginatedChannelsResponse = PaginationResult(ChannelResponse);
export const PaginatedMembersResponse = PaginationResult(MemberResponse);
export const PaginatedInvitesResponse = PaginationResult(InviteResponse);

export const ChannelErrorResponses = StandardErrorResponses;
