import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";

export const MessageSortEnum = Type.Union([
    Type.Literal("newest"),
    Type.Literal("oldest"),
]);

export const MessageBase = Type.Object({
    channelId: UUID,
    content: Type.Optional(Type.String({ maxLength: 4000 })),
    parentMessageId: Type.Optional(UUID),
});

export const MessageReactionBase = Type.Object({
    messageId: UUID,
    emoji: Type.String({ minLength: 1, maxLength: 10 }),
});

export const MessageAttachmentBase = Type.Object({
    fileName: Type.String({ minLength: 1, maxLength: 255 }),
    fileType: Type.String({ minLength: 1, maxLength: 100 }),
    size: Type.Number({ minimum: 1 }),
    s3Location: Type.String(),
});
