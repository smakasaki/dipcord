import { z } from "zod";

import { UUID } from "../common/index.js";
import { MessageAttachmentBase, MessageBase, MessageReactionBase, MessageSortEnum } from "./types.js";

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
    limit: z.number().min(1).max(100).default(50).optional(),
    cursor: z.string().optional(),
    sort: MessageSortEnum.optional(),
    parentMessageId: UUID.optional(),
    includeDeleted: z.boolean().default(false).optional(),
});

export const ToggleReactionSchema = MessageReactionBase.extend({});
