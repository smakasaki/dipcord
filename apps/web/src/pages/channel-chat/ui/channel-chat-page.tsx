import { useEffect, useState } from "react";

import type { MessageType } from "../../../entities/message";

import { ChatPanel } from "../../../widgets/chat-panel";
import { generateMockChannel, generateMockMessages } from "../model/mock-data";
import styles from "./channel-chat-page.module.css";

type ChannelChatPageProps = {
    channelId: string;
};

export function ChannelChatPage({ channelId }: ChannelChatPageProps) {
    // Mock data states
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [channel] = useState(generateMockChannel(channelId));
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);

    // Current user (mock)
    const currentUserId = "Userok";

    // Load initial messages
    useEffect(() => {
        setMessages(generateMockMessages(20, currentUserId));
    }, [channelId, currentUserId]);

    // Handle sending a new message
    const handleSendMessage = (content: string, attachments: File[], replyToMessageId?: string) => {
        const newMessage: MessageType = {
            id: `msg-${Date.now()}`,
            content,
            author: {
                id: currentUserId,
                username: "CurrentUser",
                avatar: "https://i.pravatar.cc/150?u=current-user",
            },
            timestamp: new Date().toISOString(),
            isEdited: false,
            replyTo: replyToMessageId
                ? messages.find(msg => msg.id === replyToMessageId)
                : undefined,
            attachments: attachments.map(file => ({
                id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file),
                size: file.size,
            })),
        };

        setMessages(prev => [...prev, newMessage]);
    };

    // Handle editing a message
    const handleEditMessage = (messageId: string, content: string) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, content, isEdited: true }
                : msg,
        ));
    };

    // Handle deleting a message
    const handleDeleteMessage = (messageId: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    // Handle loading more messages (pagination)
    const handleLoadMoreMessages = async () => {
    // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If we've reached a limit, stop loading more
        if (pageNumber >= 5) {
            setHasMoreMessages(false);
            return false;
        }

        // Generate and add more mock messages
        const olderMessages = generateMockMessages(10, currentUserId, true);
        setMessages(prev => [...olderMessages, ...prev]);
        setPageNumber(prev => prev + 1);

        return true;
    };

    return (
        <div className={styles.container}>
            <ChatPanel
                channelId={channelId}
                channelName={channel.name}
                channelTopic={channel.topic}
                memberCount={channel.memberCount}
                onlineCount={channel.onlineCount}
                messages={messages}
                currentUserId={currentUserId}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onLoadMoreMessages={handleLoadMoreMessages}
                hasMoreMessages={hasMoreMessages}
            />
        </div>
    );
}
