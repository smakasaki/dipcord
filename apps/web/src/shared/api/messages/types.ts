import type { paths } from "../types/api";

// Use type aliases from API schema
export type GetChannelMessagesParams = paths["/v1/channels/{channelId}/messages"]["get"]["parameters"]["query"];

// Alias to match API schema
export type SendMessageRequest = {
    content: string;
    parentMessageId?: string | null;
    attachments?: Array<{
        fileName: string;
        fileType: string;
        size: number;
        s3Location: string;
    }>;
};

export type MessageReactionRequest = {
    emoji: string;
};
