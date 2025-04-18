import type { MessageType } from "#/entities/message";

import { Button, Divider, Group, ScrollArea, Text } from "@mantine/core";
import { Message as MessageComponent } from "#/entities/message";
import { useChannelMembersStore } from "#/features/channel-members";
import { useMessagePermissionsStore, useMessagesStore } from "#/features/channel-messages";
import { useEffect, useRef, useState } from "react";

import styles from "./message-list.module.css";

type MessageGroup = {
    date: string;
    messages: MessageType[];
};

type MessageListProps = {
    messages: MessageType[];
    currentUserId: string;
    channelId: string;
    onReply: (message: MessageType) => void;
    onEdit?: (messageId: string, content: string) => void;
    onDelete?: (messageId: string) => void;
    onReact: (messageId: string) => void;
    onLoadMore: () => Promise<boolean>;
    hasMoreMessages: boolean;
    isLoading?: boolean;
    typingText?: string;
};

export function MessageList({
    messages,
    currentUserId,
    channelId,
    onReply,
    onEdit,
    onDelete,
    onReact,
    onLoadMore,
    hasMoreMessages,
    isLoading = false,
    typingText,
}: MessageListProps) {
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showNewMessagesBanner, setShowNewMessagesBanner] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const messageRefs = useRef<Record<string, HTMLDivElement>>({});
    const [previousMessagesLength, setPreviousMessagesLength] = useState(0);
    const lastScrollPositionRef = useRef<number>(0);
    const firstVisibleMessageRef = useRef<string | null>(null);

    // Get channel permissions
    const { fetchChannelMembers } = useChannelMembersStore();
    const { updatePermissions } = useMessagePermissionsStore();
    const { updateMessage, deleteMessage } = useMessagesStore();

    // Load channel members and update permissions when channel changes
    useEffect(() => {
        if (channelId) {
            fetchChannelMembers(channelId).then(() => {
                // Update permissions based on channel members
                updatePermissions();
            });
        }
    }, [channelId, fetchChannelMembers, updatePermissions]);

    // Group messages by date
    const messageGroups = groupMessagesByDate(messages);

    // Auto-scroll to bottom on first load
    useEffect(() => {
        if (initialLoad && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
            setInitialLoad(false);
        }
    }, [initialLoad, messages.length]);

    // Сохраняем позицию скролла перед загрузкой новых сообщений
    useEffect(() => {
        if (viewportRef.current && loading) {
            lastScrollPositionRef.current = viewportRef.current.scrollTop;

            // Сохраняем ID первого видимого сообщения
            if (messages.length > 0) {
                const viewport = viewportRef.current;
                const scrollPos = viewport.scrollTop;

                // Находим первое сообщение, которое видно в viewport
                for (const messageId in messageRefs.current) {
                    const messageEl = messageRefs.current[messageId];
                    if (!messageEl)
                        continue;

                    const rect = messageEl.getBoundingClientRect();
                    const elTop = rect.top + scrollPos - viewport.getBoundingClientRect().top;

                    if (elTop > scrollPos) {
                        firstVisibleMessageRef.current = messageId;
                        break;
                    }
                }
            }
        }
    }, [loading, messages.length]);

    // Восстанавливаем позицию скролла после загрузки сообщений
    useEffect(() => {
        if (!loading && messages.length > previousMessagesLength && !initialLoad) {
            // Если загрузились новые сообщения и это не первая загрузка
            const messageId = firstVisibleMessageRef.current;

            if (messageId && messageRefs.current[messageId]) {
                // Восстанавливаем позицию, чтобы пользователь остался на том же месте
                const timeoutId = setTimeout(() => {
                    if (messageRefs.current[messageId]) {
                        messageRefs.current[messageId].scrollIntoView({ block: "start", behavior: "auto" });
                    }
                }, 10);

                return () => clearTimeout(timeoutId);
            }
        }

        // Обновляем предыдущую длину сообщений для следующего сравнения
        setPreviousMessagesLength(messages.length);
    }, [messages.length, loading, initialLoad]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current && viewportRef.current && !initialLoad) {
            // Check if already at bottom
            const viewport = viewportRef.current;
            const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;

            if (isAtBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                if (showNewMessagesBanner) {
                    setShowNewMessagesBanner(false);
                }
            }
            else if (!showNewMessagesBanner) {
                setShowNewMessagesBanner(true);
            }
        }
    }, [messages.length, initialLoad, showNewMessagesBanner]);

    const handleLoadMore = async () => {
        if (loading || isLoading || !hasMoreMessages)
            return;

        setLoading(true);
        const hasMore = await onLoadMore();
        setLoading(false);

        return hasMore;
    };

    // Handle scroll detection
    const handleScroll = ({ y }: { x: number; y: number }) => {
        // Load more messages when reaching the top
        if (y < 150 && !loading && !isLoading && hasMoreMessages) {
            handleLoadMore();
        }

        // Show "new messages" banner when scrolled up
        const viewport = viewportRef.current;
        if (viewport) {
            const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

            if (distanceFromBottom > 300) {
                setShowNewMessagesBanner(true);
            }
            else {
                setShowNewMessagesBanner(false);
            }
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            if (showNewMessagesBanner) {
                setShowNewMessagesBanner(false);
            }
        }
    };

    // Функция для прокрутки к указанному сообщению
    const scrollToMessage = (messageId: string) => {
        if (messageRefs.current[messageId]) {
            messageRefs.current[messageId].scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    // Handler for editing messages
    const handleEditMessage = async (messageId: string, content: string) => {
        try {
            await updateMessage(messageId, content);
            if (onEdit) {
                onEdit(messageId, content);
            }
        }
        catch (error) {
            console.error("Failed to edit message", error);
        }
    };

    // Handler for deleting messages
    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            if (onDelete) {
                onDelete(messageId);
            }
        }
        catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    return (
        <div className={styles.container}>
            <ScrollArea
                viewportRef={viewportRef}
                onScrollPositionChange={handleScroll}
                scrollbarSize={5}
                type="hover"
                offsetScrollbars
                h="100%"
                style={{ flex: 1 }}
            >
                <div className={styles.messagesWrapper}>
                    {hasMoreMessages && (
                        <div className={styles.loadMoreContainer}>
                            <Button
                                onClick={handleLoadMore}
                                loading={loading || isLoading}
                                variant="subtle"
                                size="xs"
                            >
                                Load more messages
                            </Button>
                        </div>
                    )}

                    {messageGroups.map(group => (
                        <div key={group.date} className={styles.messageGroup}>
                            <Divider
                                className={styles.dateDivider}
                                label={<Text size="xs">{group.date}</Text>}
                            />

                            {group.messages.map((message, messageIndex) => {
                                // Проверяем, что сообщение и его поля валидны
                                if (!message || !message.id || !message.author) {
                                    return null;
                                }

                                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                                const isAuthorSame = !!prevMessage
                                    && prevMessage.author?.id === message.author?.id
                                    && (new Date(message.timestamp).getTime()
                                        - new Date(prevMessage.timestamp).getTime()) < 5 * 60 * 1000;

                                const isCurrentUser = message.author.id === currentUserId;
                                const messageClass = isCurrentUser
                                    ? `${styles.message} ${styles.ownMessage}`
                                    : isAuthorSame ? styles.continuedMessage : styles.message;

                                return (
                                    <div
                                        key={message.id}
                                        className={messageClass}
                                        ref={(el) => {
                                            if (el)
                                                messageRefs.current[message.id] = el;
                                        }}
                                    >
                                        <MessageComponent
                                            message={message}
                                            isOwnMessage={isCurrentUser}
                                            onReply={() => onReply(message)}
                                            onEdit={content => handleEditMessage(message.id, content)}
                                            onDelete={() => handleDeleteMessage(message.id)}
                                            onReact={() => onReact(message.id)}
                                            onGoToMessage={scrollToMessage}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Add typing indicator at the end of messages */}
                    {typingText && (
                        <div className={styles.typingIndicator}>
                            <Text size="xs" fs="italic" c="dimmed">
                                {typingText}
                            </Text>
                        </div>
                    )}

                    {/* This ref helps scroll to the end */}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {showNewMessagesBanner && (
                <Button
                    className={styles.newMessagesBanner}
                    onClick={scrollToBottom}
                    variant="light"
                    color="brand-orange"
                >
                    New messages
                </Button>
            )}
        </div>
    );
}

// Helper function to group messages by date
function groupMessagesByDate(messages: MessageType[]): MessageGroup[] {
    const groups: Record<string, MessageType[]> = {};

    messages.forEach((message) => {
        const date = new Date(message.timestamp).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
        date,
        messages,
    }));
}
