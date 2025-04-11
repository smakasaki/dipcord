import type { Message, MessageAttachment, MessageMention, MessagePaginationParams, MessageReaction } from "@dipcord/domain";

import { MessageFilters } from "@dipcord/domain";

export type MessageRepository = {
    createMessage: (message: Omit<Message, "id" | "createdAt" | "updatedAt" | "isEdited">) => Promise<Message>;
    getMessage: (id: string) => Promise<Message | null>;
    updateMessage: (id: string, content: string) => Promise<Message>;
    deleteMessage: (id: string) => Promise<Message>;
    getMessages: (params: MessagePaginationParams) => Promise<{
        data: Message[];
        nextCursor: string | null;
    }>;
};

export type AttachmentRepository = {
    createAttachments: (attachments: Array<Omit<MessageAttachment, "id" | "createdAt">>) => Promise<MessageAttachment[]>;
    getAttachmentsByMessageId: (messageId: string) => Promise<MessageAttachment[]>;
};

export type ReactionRepository = {
    createReaction: (reaction: Omit<MessageReaction, "id" | "createdAt">) => Promise<MessageReaction>;
    deleteReaction: (messageId: string, userId: string, emoji: string) => Promise<void>;
    getReactionsByMessageId: (messageId: string) => Promise<MessageReaction[]>;
    getReactionsByMessageIds: (messageIds: string[]) => Promise<Record<string, MessageReaction[]>>;
};

export type MentionRepository = {
    createMentions: (mentions: Array<Omit<MessageMention, "id" | "createdAt">>) => Promise<MessageMention[]>;
    getMentionsByMessageId: (messageId: string) => Promise<MessageMention[]>;
    getMentionsByMessageIds: (messageIds: string[]) => Promise<Record<string, MessageMention[]>>;
};

export type ChannelMemberRepository = {
    isUserChannelMember: (userId: string, channelId: string) => Promise<boolean>;
    getUserPermissionsInChannel: (userId: string, channelId: string) => Promise<{
        role: "owner" | "moderator" | "user";
        permissions: {
            manage_messages: boolean;
            [key: string]: boolean;
        } | null;
    } | null>;
};

export type NotificationService = {
    notifyMessageCreated: (message: Message, attachments: MessageAttachment[]) => Promise<void>;
    notifyMessageUpdated: (message: Message) => Promise<void>;
    notifyMessageDeleted: (message: Message) => Promise<void>;
    notifyReactionToggled: (reaction: MessageReaction | null, action: "add" | "remove") => Promise<void>;
};

export type MentionExtractor = {
    extractMentions: (content: string) => string[]; // Returns array of user IDs
};
