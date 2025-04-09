import { Button, Divider, Group, ScrollArea, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import type { MessageType } from "../../../entities/message";

import { Message as MessageComponent } from "../../../entities/message";
import styles from "./message-list.module.css";

type MessageGroup = {
    date: string;
    messages: MessageType[];
};

type MessageListProps = {
    messages: MessageType[];
    currentUserId: string;
    onReply: (message: MessageType) => void;
    onEdit: (messageId: string, content: string) => void;
    onDelete: (messageId: string) => void;
    onReact: (messageId: string) => void;
    onLoadMore: () => Promise<boolean>;
    hasMoreMessages: boolean;
};

export function MessageList({
    messages,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onReact,
    onLoadMore,
    hasMoreMessages,
}: MessageListProps) {
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showNewMessagesBanner, setShowNewMessagesBanner] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [initialLoad, setInitialLoad] = useState(true);

    // Group messages by date
    const messageGroups = groupMessagesByDate(messages);

    // Auto-scroll to bottom on first load
    useEffect(() => {
        if (initialLoad && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
            setInitialLoad(false);
        }
    }, [initialLoad, messages.length]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current && viewportRef.current && !initialLoad) {
            // Check if already at bottom
            const viewport = viewportRef.current;
            const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;

            if (isAtBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
            else {
                setShowNewMessagesBanner(true);
            }
        }
    }, [messages.length, initialLoad]);

    const handleLoadMore = async () => {
        if (loading || !hasMoreMessages)
            return;

        setLoading(true);
        const hasMore = await onLoadMore();
        setLoading(false);

        return hasMore;
    };

    // Handle scroll detection
    const handleScroll = ({ y }: { x: number; y: number }) => {
        // Load more messages when reaching the top
        if (y < 50 && !loading && hasMoreMessages) {
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
            setShowNewMessagesBanner(false);
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
                                loading={loading}
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
                                const isAuthorSame = messageIndex > 0
                                    && group.messages[messageIndex - 1].author.id === message.author.id
                                    && new Date(message.timestamp).getTime()
                                    - new Date(group.messages[messageIndex - 1].timestamp).getTime() < 5 * 60 * 1000;

                                return (
                                    <div
                                        key={message.id}
                                        className={isAuthorSame ? styles.continuedMessage : styles.message}
                                    >
                                        <MessageComponent
                                            message={message}
                                            isOwnMessage={message.author.id === currentUserId}
                                            onReply={() => onReply(message)}
                                            onEdit={content => onEdit(message.id, content)}
                                            onDelete={() => onDelete(message.id)}
                                            onReact={() => onReact(message.id)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {showNewMessagesBanner && (
                <div className={styles.newMessagesBanner}>
                    <Button variant="filled" color="brand-orange" size="xs" onClick={scrollToBottom}>
                        New messages
                    </Button>
                </div>
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
