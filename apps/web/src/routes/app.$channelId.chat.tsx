import { Container, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { MessageType } from "../entities/message";

import { MessageInput } from "../features/message-input";
import { generateMockMessages } from "../pages/channel-chat/model/mock-data";
import { ChannelHeader } from "../widgets/channel-header";
import { MembersSidebar } from "../widgets/members-sidebar";
import { MessageList } from "../widgets/message-list";
import styles from "./app.$channelId.chat.module.css";

export const Route = createFileRoute("/app/$channelId/chat")({
    component: ChannelChatPage,
});

const channelsMockdata = [
    { id: "1", name: "General", color: "brand-orange" },
    { id: "2", name: "Marketing", color: "brand-orange" },
    { id: "3", name: "Development", color: "brand-orange" },
    { id: "4", name: "Design", color: "brand-orange" },
    { id: "5", name: "Sales", color: "brand-orange" },
    { id: "6", name: "Support", color: "brand-orange" },
    { id: "7", name: "HR", color: "brand-orange" },
    { id: "8", name: "Finance", color: "brand-orange" },
    { id: "9", name: "Research", color: "brand-orange" },
    { id: "10", name: "Operations", color: "brand-orange" },
];

// Mock channel members
const mockChannelMembers = [
    { id: "1", name: "Alex Kim", avatar: "https://i.pravatar.cc/150?u=alex", isOnline: true },
    { id: "2", name: "Maria Lopez", avatar: "https://i.pravatar.cc/150?u=maria", isOnline: true },
    { id: "3", name: "John Doe", avatar: "https://i.pravatar.cc/150?u=john", isOnline: false },
    { id: "4", name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah", isOnline: true },
    { id: "5", name: "Robert Smith", avatar: "https://i.pravatar.cc/150?u=robert", isOnline: false },
    { id: "6", name: "Emma Johnson", avatar: "https://i.pravatar.cc/150?u=emma", isOnline: true },
    { id: "7", name: "James Wilson", avatar: "https://i.pravatar.cc/150?u=james", isOnline: false },
    { id: "8", name: "Olivia Brown", avatar: "https://i.pravatar.cc/150?u=olivia", isOnline: true },
];

function ChannelChatPage() {
    const { channelId } = Route.useParams();
    const channel = channelsMockdata.find(c => c.id === channelId);

    // Mock data states
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [replyToMessage, setReplyToMessage] = useState<MessageType | undefined>(undefined);
    const [showMembersList, setShowMembersList] = useState(false);

    // Current user (mock)
    const currentUserId = "current-user";

    // Load initial messages
    useEffect(() => {
        setMessages(generateMockMessages(20, currentUserId));
    }, [channelId, currentUserId]);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

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
                id: `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

    // Handle replying to a message
    const handleReply = (message: MessageType) => {
        setReplyToMessage(message);
    };

    // Handle canceling reply
    const handleCancelReply = () => {
        setReplyToMessage(undefined);
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

    // Handle reactions
    const handleReact = (messageId: string) => {
        // Mock implementation - in a real app this would show a reaction picker
        console.log("React to message:", messageId);
    };

    // Toggle members list sidebar
    const toggleMembersList = () => {
        setShowMembersList(prev => !prev);
    };

    return (
        <Container fluid className={styles.container}>
            <ChannelHeader
                channelName={channel.name}
                channelTopic="Channel discussion"
                memberCount={mockChannelMembers.length}
                onlineCount={mockChannelMembers.filter(m => m.isOnline).length}
                onToggleMembersList={toggleMembersList}
                membersListVisible={showMembersList}
            />

            <div className={styles.contentWrapper}>
                <div className={styles.chatContent}>
                    <div className={styles.messageListContainer}>
                        <MessageList
                            messages={messages}
                            currentUserId={currentUserId}
                            onReply={handleReply}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReact={handleReact}
                            onLoadMore={handleLoadMoreMessages}
                            hasMoreMessages={hasMoreMessages}
                        />
                    </div>

                    <MessageInput
                        onSendMessage={handleSendMessage}
                        replyToMessage={replyToMessage}
                        onCancelReply={handleCancelReply}
                        channelName={channel.name}
                    />
                </div>

                {showMembersList && (
                    <div className={styles.sidebarContainer}>
                        <MembersSidebar
                            members={mockChannelMembers}
                            onClose={toggleMembersList}
                        />
                    </div>
                )}
            </div>
        </Container>
    );
}
