import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";
import { PaginationResult } from "../common/pagination.js";

export const MessageAttachmentResponseSchema = Type.Object({
    id: UUID,
    messageId: UUID,
    fileName: Type.String(),
    fileType: Type.String(),
    size: Type.Number(),
    s3Location: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
});

export const MessageReactionResponseSchema = Type.Object({
    id: UUID,
    messageId: UUID,
    userId: UUID,
    emoji: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
});

export const MessageMentionResponseSchema = Type.Object({
    id: UUID,
    messageId: UUID,
    mentionedUserId: UUID,
    createdAt: Type.String({ format: "date-time" }),
});

export const MessageResponseSchema = Type.Object({
    id: UUID,
    channelId: UUID,
    userId: UUID,
    content: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
    isEdited: Type.Boolean(),
    parentMessageId: Type.Union([UUID, Type.Null()]),
    isDeleted: Type.Boolean(),
    attachments: Type.Optional(Type.Array(MessageAttachmentResponseSchema)),
    reactions: Type.Optional(Type.Array(MessageReactionResponseSchema)),
    mentions: Type.Optional(Type.Array(MessageMentionResponseSchema)),
});

export const MessagesResponseSchema = PaginationResult(MessageResponseSchema);
