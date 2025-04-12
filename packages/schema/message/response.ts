import { z } from "zod";

import { UUID } from "../common/index.js";
import { PaginationResult } from "../common/pagination.js";

export const MessageAttachmentResponseSchema = z.object({
    id: UUID,
    messageId: UUID,
    fileName: z.string(),
    fileType: z.string(),
    size: z.number(),
    s3Location: z.string(),
    createdAt: z.string().datetime(),
});

export const MessageReactionResponseSchema = z.object({
    id: UUID,
    messageId: UUID,
    userId: UUID,
    emoji: z.string(),
    createdAt: z.string().datetime(),
});

export const MessageMentionResponseSchema = z.object({
    id: UUID,
    messageId: UUID,
    mentionedUserId: UUID,
    createdAt: z.string().datetime(),
});

export const MessageResponseSchema = z.object({
    id: UUID,
    channelId: UUID,
    userId: UUID,
    content: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    isEdited: z.boolean(),
    parentMessageId: UUID.nullable(),
    isDeleted: z.boolean(),
    attachments: z.array(MessageAttachmentResponseSchema).optional(),
    reactions: z.array(MessageReactionResponseSchema).optional(),
    mentions: z.array(MessageMentionResponseSchema).optional(),
});

export const MessagesResponseSchema = PaginationResult(MessageResponseSchema);
