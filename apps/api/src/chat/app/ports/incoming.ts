import type { Message, MessageAttachment, MessageReaction } from "@dipcord/domain";

import { MessagePaginationParams } from "@dipcord/domain";

export type SendMessageParams = {
    userId: string;
    channelId: string;
    content: string | null;
    parentMessageId?: string | null;
    attachments?: Array<{
        fileName: string;
        fileType: string;
        size: number;
        s3Location: string;
    }>;
};

export type SendMessageResult = {
    message: Message;
    attachments: MessageAttachment[];
};

export type SendMessageUseCase = {
    execute: (params: SendMessageParams) => Promise<SendMessageResult>;
};

export type GetChannelMessagesParams = {
    userId: string;
    channelId: string;
    limit?: number;
    cursor?: string;
    sort?: "newest" | "oldest";
    parentMessageId?: string | null;
    includeDeleted?: boolean;
};

export type GetChannelMessagesResult = {
    messages: Message[];
    nextCursor: string | null;
    attachments: Record<string, MessageAttachment[]>;
    reactions: Record<string, MessageReaction[]>;
};

export type GetChannelMessagesUseCase = {
    execute: (params: GetChannelMessagesParams) => Promise<GetChannelMessagesResult>;
};

export type UpdateMessageParams = {
    userId: string;
    messageId: string;
    content: string;
};

export type UpdateMessageUseCase = {
    execute: (params: UpdateMessageParams) => Promise<Message>;
};

export type DeleteMessageParams = {
    userId: string;
    messageId: string;
};

export type DeleteMessageUseCase = {
    execute: (params: DeleteMessageParams) => Promise<Message>;
};

export type ToggleReactionParams = {
    userId: string;
    messageId: string;
    emoji: string;
};

export type ToggleReactionResult = {
    action: "add" | "remove";
    reaction: MessageReaction | null;
};

export type ToggleReactionUseCase = {
    execute: (params: ToggleReactionParams) => Promise<ToggleReactionResult>;
};
