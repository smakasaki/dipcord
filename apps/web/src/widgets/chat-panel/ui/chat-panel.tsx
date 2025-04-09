import { useState } from "react";

import type { MessageType } from "../../../entities/message";

import { MessageInput } from "../../../features/message-input";
import { ChannelHeader } from "../../channel-header";
import { MessageList } from "../../message-list";
import styles from "./chat-panel.module.css";

type ChatPanelProps = {
    channelId: string;
    channelName: string;
    channelTopic?: string;
    memberCount?: number;
    onlineCount?: number;
    messages: MessageType[];
    currentUserId: string;
    onSendMessage: (content: string, attachments: File[], replyToMessageId?: string) => void;
    onEditMessage: (messageId: string, content: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onLoadMoreMessages: () => Promise<boolean>;
    hasMoreMessages: boolean;
};

export function ChatPanel({
    channelId,
    channelName,
    channelTopic,
    memberCount,
    onlineCount,
    messages,
    currentUserId,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    onLoadMoreMessages,
    hasMoreMessages,
}: ChatPanelProps) {
    const [replyToMessage, setReplyToMessage] = useState<MessageType | undefined>(undefined);
    const [editingMessageId, setEditingMessageId] = useState<string | undefined>(undefined);

    const handleReply = (message: MessageType) => {
        setReplyToMessage(message);
    };

    const handleCancelReply = () => {
        setReplyToMessage(undefined);
    };

    const handleEdit = (messageId: string) => {
        setEditingMessageId(messageId);
    };

    const handleDelete = (messageId: string) => {
        onDeleteMessage(messageId);
    };

    const handleReact = (messageId: string) => {
    // Mock implementation - in a real app this would show a reaction picker
        console.log("React to message:", messageId);
    };

    const handleSendMessage = (content: string, attachments: File[]) => {
        onSendMessage(content, attachments, replyToMessage?.id);
        setReplyToMessage(undefined);
    };

    return (
        <div className={styles.container}>
            <ChannelHeader
                channelName={channelName}
                channelTopic={channelTopic}
                memberCount={memberCount}
                onlineCount={onlineCount}
            />

            <div className={styles.messagesContainer}>
                <MessageList
                    messages={messages}
                    currentUserId={currentUserId}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    onLoadMore={onLoadMoreMessages}
                    hasMoreMessages={hasMoreMessages}
                />
            </div>

            <div className={styles.inputContainer}>
                <MessageInput
                    onSendMessage={handleSendMessage}
                    replyToMessage={replyToMessage}
                    onCancelReply={handleCancelReply}
                    channelName={channelName}
                />
            </div>
        </div>
    );
}
