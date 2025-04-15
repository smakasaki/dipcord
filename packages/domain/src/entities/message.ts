export interface Message {
    id: string;
    channelId: string;
    userId: string;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    parentMessageId: string | null;
    isDeleted: boolean;
}

export interface MessageAttachment {
    id: string;
    messageId: string;
    fileName: string;
    fileType: string;
    size: number;
    s3Location: string;
    createdAt: Date;
}

export interface MessageReaction {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
}

export interface MessageMention {
    id: string;
    messageId: string;
    mentionedUserId: string;
    createdAt: Date;
} 