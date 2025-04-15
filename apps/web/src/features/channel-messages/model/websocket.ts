import type { Message } from "#/entities/message";
import type { ServerToClientEvents } from "#/shared/api/socket";

import { socketService } from "#/shared/api/socket";
import { useEffect, useRef, useState } from "react";

import { useMessagesStore } from "./store";

export function useChannelWebsocket(channelId: string | undefined) {
    const [isConnected, setIsConnected] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<string, { username: string; timestamp: number }>>(
        new Map(),
    );
    const [wasHidden, setWasHidden] = useState(false);
    const lastMessageTimestampRef = useRef<number>(Date.now());

    const messagesStore = useMessagesStore();

    // Handler for page visibility changes
    useEffect(() => {
        if (!channelId)
            return;

        // Refresh messages when page becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // If page was previously hidden or we're not connected to websocket
                if (wasHidden || !isConnected) {
                    console.log("Page became visible again or connection lost, refreshing messages");
                    messagesStore.fetchMessages(channelId);
                    setWasHidden(false);
                }
            }
            else if (document.visibilityState === "hidden") {
                // Record that the page was hidden
                setWasHidden(true);
                // Save timestamp of when the page was hidden
                lastMessageTimestampRef.current = Date.now();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [channelId, wasHidden, isConnected]);

    useEffect(() => {
        if (!channelId)
            return;

        // Connect to socket server
        const socket = socketService.connect();

        // Join channel
        const joinChannel = async () => {
            if (!channelId)
                return;
            const success = await socketService.joinChannel(channelId);
            setIsJoined(success);
        };

        const handleConnect = () => {
            setIsConnected(true);
            joinChannel();

            // If we were previously disconnected, refresh messages
            if (!isConnected) {
                messagesStore.fetchMessages(channelId);
            }
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setIsJoined(false);
        };

        // Handle new messages
        const handleMessageCreated = (data: Parameters<ServerToClientEvents["message:created"]>[0]) => {
            if (data.channelId !== channelId)
                return;

            // Update last message timestamp
            lastMessageTimestampRef.current = Date.now();

            // For simplicity, let's just reload the channel messages
            try {
                messagesStore.fetchMessages(channelId);
            }
            catch {
                // Silent error handling
            }
        };

        // Handle message updates
        const handleMessageUpdated = (data: Parameters<ServerToClientEvents["message:updated"]>[0]) => {
            if (data.channelId !== channelId)
                return;

            // Just refresh messages to keep it simple
            try {
                messagesStore.fetchMessages(channelId);
            }
            catch {
                // Silent error handling
            }
        };

        // Handle message deletions
        const handleMessageDeleted = (data: Parameters<ServerToClientEvents["message:deleted"]>[0]) => {
            if (data.channelId !== channelId)
                return;

            try {
                messagesStore.fetchMessages(channelId);
            }
            catch {
                // Silent error handling
            }
        };

        // Handle message reactions
        const handleMessageReaction = (_data: Parameters<ServerToClientEvents["message:reaction"]>[0]) => {
            // For now, just refresh all messages in the channel
            try {
                messagesStore.fetchMessages(channelId);
            }
            catch {
                // Silent error handling
            }
        };

        // Handle typing indicators
        const handleTypingStart = (data: Parameters<ServerToClientEvents["typing:start"]>[0]) => {
            if (data.channelId !== channelId)
                return;
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(data.userId, {
                    username: data.username,
                    timestamp: Date.now(),
                });
                return newMap;
            });
        };

        const handleTypingStop = (data: Parameters<ServerToClientEvents["typing:stop"]>[0]) => {
            if (data.channelId !== channelId)
                return;
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(data.userId);
                return newMap;
            });
        };

        // Connect socket and register event handlers
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("message:created", handleMessageCreated);
        socket.on("message:updated", handleMessageUpdated);
        socket.on("message:deleted", handleMessageDeleted);
        socket.on("message:reaction", handleMessageReaction);
        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        // If socket is already connected, join the channel
        if (socket.connected) {
            setIsConnected(true);
            joinChannel();
        }

        // Clean up function
        return () => {
            if (channelId) {
                socketService.leaveChannel(channelId);
            }

            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("message:created", handleMessageCreated);
            socket.off("message:updated", handleMessageUpdated);
            socket.off("message:deleted", handleMessageDeleted);
            socket.off("message:reaction", handleMessageReaction);
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
        };
    }, [channelId]);

    // Check if there are users currently typing
    // Clean out stale typing indicators (older than 5 seconds)
    const getActiveTypingUsers = () => {
        const now = Date.now();
        const activeUsers: string[] = [];

        typingUsers.forEach((data, userId) => {
            if (now - data.timestamp < 5000) {
                activeUsers.push(data.username);
            }
            else {
                // Clean up stale typing indicators
                setTypingUsers((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(userId);
                    return newMap;
                });
            }
        });

        return activeUsers;
    };

    // Utility functions to interact with socket
    const startTyping = () => {
        if (channelId) {
            socketService.startTyping(channelId);
        }
    };

    const stopTyping = () => {
        if (channelId) {
            socketService.stopTyping(channelId);
        }
    };

    const markLastMessageAsRead = (messageId: string) => {
        if (channelId && messageId) {
            socketService.markMessageAsRead(channelId, messageId);
        }
    };

    // Add function to manually refresh messages
    const refreshMessages = () => {
        if (channelId) {
            return messagesStore.fetchMessages(channelId);
        }
        return Promise.resolve();
    };

    return {
        isConnected,
        isJoined,
        typingUsers: getActiveTypingUsers(),
        startTyping,
        stopTyping,
        markLastMessageAsRead,
        refreshMessages,
    };
}
