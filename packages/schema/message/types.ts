import { z } from "zod";

import { UUID } from "../common/index.js";

export const MessageSortEnum = z.enum([
    "newest",
    "oldest",
]);

export const MessageBase = z.object({
    channelId: UUID,
    content: z.string().max(4000).optional(),
    parentMessageId: UUID.optional(),
});

export const MessageReactionBase = z.object({
    messageId: UUID,
    emoji: z.string().min(1).max(10),
});

export const MessageAttachmentBase = z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.string().min(1).max(100),
    size: z.number().min(1),
    s3Location: z.string(),
});
