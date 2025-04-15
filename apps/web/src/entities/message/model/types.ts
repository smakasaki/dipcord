export type MessageAuthor = {
    id: string;
    username: string;
    avatar?: string;
    name?: string;
    surname?: string;
};

export type MessageAttachment = {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
};

export type MessageReaction = {
    emoji: string;
    count: number;
    users: string[]; // IDs of users who reacted
};

export type Message = {
    id: string;
    content: string;
    author: MessageAuthor;
    channelId: string;
    timestamp: Date;
    isEdited: boolean;
    replyTo?: Message;
    replyToId?: string;
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    isUnavailable?: boolean;
};

// Match the API response structure more closely
export type MessageResponse = {
    id: string;
    content: string | null;
    channelId: string;
    userId: string;
    author?: MessageAuthor; // We'll compute this from userId
    createdAt: string;
    updatedAt: string;
    timestamp?: string; // Will be derived from createdAt
    isEdited: boolean;
    parentMessageId: string | null;
    replyToId?: string; // Alias for parentMessageId
    replyTo?: MessageResponse;
    isDeleted: boolean;
    attachments?: Array<{
        id: string;
        name?: string;
        fileName?: string;
        type?: string;
        fileType?: string;
        url?: string;
        s3Location?: string;
        size: number;
    }>;
    reactions?: Array<{
        emoji: string;
        count: number;
        users: string[];
    }>;
    mentions?: Array<{
        userId: string;
        username: string;
    }>;
};
