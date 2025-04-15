import { z } from "zod";

import { UUID } from "../common/index.js";
import { MessageAttachmentBase, MessageBase, MessageSortEnum } from "./types.js";

export const MessageIdParam = z.object({
    messageId: UUID,
});

export const SendMessageSchema = MessageBase.extend({
    attachments: z.array(MessageAttachmentBase).optional(),
});

export const UpdateMessageSchema = z.object({
    messageId: UUID,
    content: z.string().min(1).max(4000),
});

export const DeleteMessageSchema = z.object({
    messageId: UUID,
});

export const GetChannelMessagesSchema = z.object({
    channelId: UUID,
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    cursor: z.string().optional(),
    sort: MessageSortEnum.optional(),
    parentMessageId: UUID.optional(),
    includeDeleted: z.coerce.boolean().default(false).optional(),
});

export const ToggleReactionSchema = z.object({
    messageId: UUID,
    emoji: z.string().min(1).max(10),
});

export const GetMessageRepliesSchema = z.object({
    messageId: UUID,
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    cursor: z.string().optional(),
    sort: MessageSortEnum.optional(),
    includeDeleted: z.coerce.boolean().default(false).optional(),
});

export const GetUserMentionsSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    cursor: z.string().optional(),
});
