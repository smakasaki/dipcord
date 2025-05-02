import type { MessageType } from "#/entities/message";
import type { ListRange, VirtuosoHandle } from "react-virtuoso";

import { Button, Divider, Text } from "@mantine/core";
import { Message as MessageComponent } from "#/entities/message";
import { useChannelMembersStore } from "#/features/channel-members";
import { useMessagePermissionsStore, useMessagesStore } from "#/features/channel-messages";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import styles from "./message-list.module.css";

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

type VirtuosoItem = {
    type: "header" | "message";
    content: string | MessageType;
    id: string;
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
    const [showNewMessagesBanner, setShowNewMessagesBanner] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [visibleRange, setVisibleRange] = useState<ListRange>({ startIndex: 0, endIndex: 0 });
    const [firstVisibleItemId, setFirstVisibleItemId] = useState<string | null>(null);

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

    // Prepare virtualized items with date headers
    const virtuosoData = useMemo((): VirtuosoItem[] => {
        // Group messages by date
        const messagesByDate = {} as Record<string, MessageType[]>;

        messages.forEach((message) => {
            const date = new Date(message.timestamp).toLocaleDateString();
            if (!messagesByDate[date]) {
                messagesByDate[date] = [];
            }
            messagesByDate[date].push(message);
        });

        // Create an array with date headers and messages
        const result: VirtuosoItem[] = [];

        Object.entries(messagesByDate).forEach(([date, messagesInGroup]) => {
            // Add date header
            result.push({
                type: "header",
                content: date,
                id: `header-${date}`,
            });

            // Add messages
            messagesInGroup.forEach((message) => {
                result.push({
                    type: "message",
                    content: message,
                    id: message.id,
                });
            });
        });

        return result;
    }, [messages]);

    // Update effect for scrolling to bottom on initial load
    useEffect(() => {
        if (initialLoad && messages.length > 0) {
            // We need a short timeout to ensure Virtuoso has rendered the items
            const timeoutId = setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({
                    index: virtuosoData.length - 1,
                    behavior: "auto",
                });
                setInitialLoad(false);
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [initialLoad, messages.length, virtuosoData.length]);

    // Effect to restore scroll position after loading more messages
    useEffect(() => {
        if (firstVisibleItemId && !loading && virtuosoData.length > 0) {
            const index = virtuosoData.findIndex(item => item.id === firstVisibleItemId);
            if (index !== -1) {
                virtuosoRef.current?.scrollToIndex({
                    index,
                    behavior: "auto",
                    align: "start",
                });
                setFirstVisibleItemId(null);
            }
        }
    }, [virtuosoData, loading, firstVisibleItemId]);

    // Track range changes to know what items are visible
    const handleRangeChange = useCallback((range: ListRange) => {
        setVisibleRange(range);
    }, []);

    // Handler for loading more messages
    const handleLoadMore = useCallback(async () => {
        if (loading || isLoading || !hasMoreMessages)
            return;

        setLoading(true);

        // Store the ID of the first visible item to maintain scroll position
        if (visibleRange.startIndex >= 0 && virtuosoData.length > visibleRange.startIndex && virtuosoData[visibleRange.startIndex]) {
            const item = virtuosoData[visibleRange.startIndex];
            if (item && item.id) {
                setFirstVisibleItemId(item.id);
            }
        }

        try {
            await onLoadMore();
            setLoading(false);
        }
        catch (error) {
            setLoading(false);
            setFirstVisibleItemId(null);
            console.error("Error loading more messages:", error);
        }
    }, [loading, isLoading, hasMoreMessages, onLoadMore, visibleRange, virtuosoData]);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        virtuosoRef.current?.scrollToIndex({
            index: virtuosoData.length - 1,
            behavior: "auto",
        });
        setShowNewMessagesBanner(false);
    }, [virtuosoData.length]);

    // Scroll to specific message
    const scrollToMessage = useCallback((messageId: string) => {
        const messageIndex = virtuosoData.findIndex(
            item => item.type === "message"
                && typeof item.content !== "string"
                && item.content.id === messageId,
        );

        if (messageIndex !== -1) {
            virtuosoRef.current?.scrollToIndex({
                index: messageIndex,
                behavior: "auto",
                align: "center",
            });
        }
    }, [virtuosoData]);

    // Handle editing messages
    const handleEditMessage = useCallback(async (messageId: string, content: string) => {
        try {
            await updateMessage(messageId, content);
            if (onEdit) {
                onEdit(messageId, content);
            }
        }
        catch (error) {
            console.error("Failed to edit message", error);
        }
    }, [updateMessage, onEdit]);

    // Handle deleting messages
    const handleDeleteMessage = useCallback(async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            if (onDelete) {
                onDelete(messageId);
            }
        }
        catch (error) {
            console.error("Failed to delete message", error);
        }
    }, [deleteMessage, onDelete]);

    // Item renderer for the virtuoso list
    const itemContent = useCallback((index: number, item: VirtuosoItem) => {
        if (item.type === "header") {
            return (
                <Divider
                    className={styles.dateDivider}
                    label={<Text size="xs">{typeof item.content === "string" ? item.content : null}</Text>}
                />
            );
        }

        if (item.type === "message" && typeof item.content !== "string") {
            const message = item.content;
            const isCurrentUser = message.author.id === currentUserId;

            // Check for previous message to determine if it's a continued message from same author
            let isAuthorSame = false;
            if (index > 0) {
                const prevItem = virtuosoData[index - 1];
                if (prevItem && prevItem.type === "message" && typeof prevItem.content !== "string") {
                    const prevMessage = prevItem.content;
                    isAuthorSame = prevMessage.author?.id === message.author?.id
                        && (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) < 5 * 60 * 1000;
                }
            }

            const messageClass = isCurrentUser
                ? `${styles.message} ${styles.ownMessage}`
                : isAuthorSame ? styles.continuedMessage : styles.message;

            return (
                <div className={messageClass}>
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
        }

        return null;
    }, [currentUserId, virtuosoData, onReply, onReact, handleEditMessage, handleDeleteMessage, scrollToMessage]);

    // Virtuoso components
    const components = useMemo(() => ({
        Header: hasMoreMessages
            ? () => (
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
                )
            : undefined,

        Footer: typingText
            ? () => (
                    <div className={styles.typingIndicator}>
                        <Text size="xs" fs="italic" c="dimmed">
                            {typingText}
                        </Text>
                    </div>
                )
            : undefined,
    }), [hasMoreMessages, loading, isLoading, handleLoadMore, typingText]);

    // Watch for scroll events to show/hide new messages banner
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;

        // Show banner if not at bottom and new messages have arrived
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (!isAtBottom && messages.length > 0 && !showNewMessagesBanner) {
            setShowNewMessagesBanner(true);
        }
        else if (isAtBottom && showNewMessagesBanner) {
            setShowNewMessagesBanner(false);
        }
    }, [messages.length, showNewMessagesBanner]);

    return (
        <div className={styles.container}>
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: "100%", width: "100%" }}
                data={virtuosoData}
                itemContent={itemContent}
                components={components}
                followOutput="auto"
                firstItemIndex={0}
                initialTopMostItemIndex={virtuosoData.length - 1}
                alignToBottom
                key={channelId} // Reset virtuoso when channel changes
                atTopThreshold={150} // Load more messages when 150px from top
                atTopStateChange={(atTop) => {
                    if (atTop && hasMoreMessages && !loading && !isLoading) {
                        handleLoadMore();
                    }
                }}
                onScroll={handleScroll}
                rangeChanged={handleRangeChange}
                computeItemKey={index => (virtuosoData[index] ? virtuosoData[index].id : `item-${index}`)}
            />

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
