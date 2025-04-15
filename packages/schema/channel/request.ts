import { z } from "zod";

import { UUID } from "../common/index.js";
import { ChannelBase, ChannelRoleEnum, InviteBase } from "./types.js";

export const ChannelIdParam = z.object({
    channelId: UUID,
});

export const MemberIdParam = z.object({
    memberId: UUID,
});

export const InviteIdParam = z.object({
    inviteId: UUID,
});

export const CreateChannelRequest = ChannelBase;

export const UpdateChannelRequest = ChannelBase.partial();

export const AddMemberRequest = z.object({
    userId: UUID,
    role: ChannelRoleEnum.optional(),
});

export const UpdateMemberRoleRequest = z.object({
    role: ChannelRoleEnum,
});

export const UpdateMemberPermissionsRequest = z.object({
    permissions: z.record(z.string(), z.boolean()),
});

export const CreateInviteRequest = InviteBase;
