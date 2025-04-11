import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";
import { MessageAttachmentBase, MessageBase, MessageReactionBase, MessageSortEnum } from "./types.js";

export const SendMessageSchema = Type.Intersect([
    MessageBase,
    Type.Object({
        attachments: Type.Optional(Type.Array(MessageAttachmentBase)),
    }),
]);

export const UpdateMessageSchema = Type.Object({
    messageId: UUID,
    content: Type.String({ minLength: 1, maxLength: 4000 }),
});

export const DeleteMessageSchema = Type.Object({
    messageId: UUID,
});

export const GetChannelMessagesSchema = Type.Object({
    channelId: UUID,
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
    cursor: Type.Optional(Type.String()),
    sort: Type.Optional(MessageSortEnum),
    parentMessageId: Type.Optional(UUID),
    includeDeleted: Type.Optional(Type.Boolean({ default: false })),
});

export const ToggleReactionSchema = Type.Intersect([
    MessageReactionBase,
    Type.Object({}),
]);
