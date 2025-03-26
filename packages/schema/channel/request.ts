import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";
import { ChannelBase, ChannelRoleEnum, InviteBase } from "./types.js";

export const ChannelIdParam = Type.Object({
    channelId: UUID,
});

export const MemberIdParam = Type.Object({
    memberId: UUID,
});

export const InviteIdParam = Type.Object({
    inviteId: UUID,
});

export const CreateChannelRequest = ChannelBase;

export const UpdateChannelRequest = Type.Partial(ChannelBase);

export const AddMemberRequest = Type.Object({
    userId: UUID,
    role: Type.Optional(ChannelRoleEnum),
});

export const UpdateMemberRoleRequest = Type.Object({
    role: ChannelRoleEnum,
});

export const UpdateMemberPermissionsRequest = Type.Object({
    permissions: Type.Record(Type.String(), Type.Boolean()),
});

export const CreateInviteRequest = InviteBase;
