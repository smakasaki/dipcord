import type { MessageType } from "#/entities/message";

import { Container, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useChannelMembersStore } from "#/features/channel-members";
import { useChannelMessages, useChannelWebsocket, useMessageActions, useMessages } from "#/features/channel-messages";
import { useChannels } from "#/features/channels";
import { useMessagePermissionsStore } from "#/features/channel-messages/model/permissions";
import { useAuthStore } from "#/features/auth";
import { MessageInput } from "#/features/message-input";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { ChannelHeader } from "#/widgets/channel-header";
import { MembersSidebar } from "#/widgets/members-sidebar";
import { MessageList } from "#/widgets/message-list";
import { useEffect, useState } from "react";

import styles from "./app.$channelId.chat.module.css";

export const Route = createFileRoute("/app/$channelId/chat")({
    component: ChannelChatPage,
});

function ChannelChatPage() {
    const { channelId } = Route.useParams();
    const channels = useChannels();
    const channel = channels.find(c => c.id === channelId);

    const messages = useMessages();
    const { getChannelMessages, isLoading: isMessagesLoading, nextCursor } = useChannelMessages();
    const messageActions = useMessageActions();
    
    // Get user info from auth store
    const { user } = useAuthStore();
    const currentUserId = user?.id || "";

    // Get WebSocket functionality
    const {
        isConnected: isSocketConnected,
        typingUsers,
        startTyping,
        stopTyping,
        markLastMessageAsRead,
    } = useChannelWebsocket(channelId);

    // Get channel members store functionality
    const {
        members,
        users,
        fetchChannelMembers,
        startActiveUsersPolling,
        stopActiveUsersPolling,
        isUserActive,
    } = useChannelMembersStore();
    
    // Get message permissions
    const { updatePermissions } = useMessagePermissionsStore();

    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [replyToMessage, setReplyToMessage] = useState<MessageType | undefined>(undefined);
    const [showMembersList, setShowMembersList] = useState(false);

    // Load initial messages and channel members
    useEffect(() => {
        if (channelId) {
            getChannelMessages(channelId);
            fetchChannelMembers(channelId).then(() => {
                // Update permissions when members are loaded
                updatePermissions();
            });
            startActiveUsersPolling(channelId);
        }

        // Cleanup on unmount or channel change
        return () => {
            stopActiveUsersPolling();
        };
    }, [channelId, getChannelMessages, fetchChannelMembers, startActiveUsersPolling, stopActiveUsersPolling, updatePermissions]);

    // Update hasMoreMessages when nextCursor changes
    useEffect(() => {
        setHasMoreMessages(!!nextCursor);
    }, [nextCursor]);

    // Mark latest message as read
    useEffect(() => {
        if (!messages?.length || !channelId || !markLastMessageAsRead)
            return;

        // Get the most recent message
        const latestMessage = [...messages].sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime(),
        )[0];

        // Mark it as read if we have a valid message
        if (latestMessage?.id) {
            markLastMessageAsRead(latestMessage.id);
        }
    }, [messages, channelId, markLastMessageAsRead]);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

    // Handle sending a new message
    const handleSendMessage = (content: string, attachments: File[], replyToMessageId?: string) => {
        // Convert File objects to file URLs (in a real implementation, you would upload files first)
        const attachmentUrls = attachments.map(file => URL.createObjectURL(file));

        if (replyToMessageId) {
            // Если отвечаем на сообщение
            messageActions.replyToMessage(replyToMessageId, content, attachmentUrls);
        }
        else {
            // Обычное сообщение
            messageActions.sendMessage(content, attachmentUrls);
        }

        // Сбросить состояние ответа
        if (replyToMessage) {
            setReplyToMessage(undefined);
        }

        // Stop typing indicator
        stopTyping();
    };

    // Handle editing a message
    const handleEditMessage = (messageId: string, content: string) => {
        messageActions.updateMessage(messageId, content);
    };

    // Handle deleting a message
    const handleDeleteMessage = (messageId: string) => {
        messageActions.deleteMessage(messageId);
    };

    // Handle replying to a message
    const handleReply = (message: MessageType) => {
        setReplyToMessage(message);
    };

    // Handle canceling reply
    const handleCancelReply = () => {
        setReplyToMessage(undefined);
    };

    // Handle typing indicators
    const handleInputFocus = () => {
        // Start typing indicator
        startTyping();
    };

    const handleInputBlur = () => {
        // Stop typing indicator
        stopTyping();
    };

    // Handle message input typing
    const handleInputTyping = () => {
        // Refresh typing indicator by starting it again
        startTyping();
    };

    // Handle loading more messages (pagination)
    const handleLoadMoreMessages = async () => {
        // If we're already at the beginning, stop loading more
        if (isMessagesLoading || !nextCursor) {
            setHasMoreMessages(false);
            return false;
        }

        try {
            await getChannelMessages(channelId, {
                limit: 20,
                cursor: nextCursor,
            });

            // hasMoreMessages будет обновлен в useEffect
            return true;
        }
        catch {
            setHasMoreMessages(false);
            return false;
        }
    };

    // Handle reactions
    const handleReact = (messageId: string) => {
        // For simplicity, we'll just add a 👍 reaction
        messageActions.addReaction(messageId, "👍");
    };

    // Toggle members list sidebar
    const toggleMembersList = () => {
        setShowMembersList(prev => !prev);
    };

    // Format typing indicators text
    const getTypingText = () => {
        if (typingUsers.length === 0)
            return "";

        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing...`;
        }
        else if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
        }
        else {
            return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    // Add socket connection status to the UI
    const connectionStatus = isSocketConnected
        ? "Connected to real-time updates"
        : "Connecting to server...";

    // Prepare members for sidebar display
    const channelMembers = members.map((member) => {
        const userInfo = users[member.userId];

        return {
            id: member.userId,
            name: userInfo ? `${userInfo.name} ${userInfo.surname}` : member.userId,
            // Use Dicebear avatar if user doesn't have a custom one
            avatar: userInfo?.avatar || getUserAvatarUrl(member.userId),
            isOnline: isUserActive(member.userId),
        };
    });

    // Count online members
    const onlineCount = channelMembers.filter(m => m.isOnline).length;

    return (
        <Container fluid className={styles.container}>
            <ChannelHeader
                channelName={channel.name}
                channelTopic={channel.description || "Channel discussion"}
                memberCount={members.length}
                onlineCount={onlineCount}
                onToggleMembersList={toggleMembersList}
                membersListVisible={showMembersList}
                connectionStatus={connectionStatus}
            />

            <div className={styles.contentWrapper}>
                <div className={styles.chatContent}>
                    <div className={styles.messageListContainer}>
                        <MessageList
                            messages={messages}
                            currentUserId={currentUserId}
                            channelId={channelId}
                            onReply={handleReply}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReact={handleReact}
                            onLoadMore={handleLoadMoreMessages}
                            hasMoreMessages={hasMoreMessages}
                            isLoading={isMessagesLoading}
                            typingText={getTypingText()}
                        />
                    </div>

                    <MessageInput
                        onSendMessage={handleSendMessage}
                        replyToMessage={replyToMessage}
                        onCancelReply={handleCancelReply}
                        channelName={channel.name}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onTyping={handleInputTyping}
                    />
                </div>

                {showMembersList && (
                    <div className={styles.sidebarContainer}>
                        <MembersSidebar
                            members={channelMembers}
                            onClose={toggleMembersList}
                        />
                    </div>
                )}
            </div>
        </Container>
    );
}
