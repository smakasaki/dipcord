// src/commons/infra/ws/types.ts

import type { Socket } from "socket.io";

// Define event names as string literals for better type safety
export type MessageEvent = "message:created" | "message:updated" | "message:deleted" | "message:reaction";
export type UserEvent = "user:activity" | "channel:joined" | "channel:left";
export type TypingEvent = "typing:start" | "typing:stop";
export type ReadEvent = "message:read";

// Events from server to client
export type ServerToClientEvents = {
    // Message events
    "message:created": (data: {
        messageId: string;
        channelId: string;
        userId: string;
        content: string | null;
        createdAt: string;
        parentMessageId?: string | null;
        attachments: Array<{
            id: string;
            fileName: string;
            fileType: string;
            size: number;
            s3Location: string;
        }>;
    }) => void;

    "message:updated": (data: {
        messageId: string;
        channelId: string;
        content: string;
        updatedAt: string;
        isEdited: boolean;
    }) => void;

    "message:deleted": (data: {
        messageId: string;
        channelId: string;
    }) => void;

    "message:reaction": (data: {
        messageId: string;
        userId: string;
        emoji: string;
        action: "add" | "remove";
    }) => void;

    // User activity events
    "user:activity": (data: {
        userId: string;
        username: string;
        status: "online" | "offline" | "away";
        channelId?: string;
    }) => void;

    "channel:joined": (data: {
        channelId: string;
        userId: string;
        username: string;
    }) => void;

    "channel:left": (data: {
        channelId: string;
        userId: string;
        username: string;
    }) => void;

    // Optional: Typing indicators and read receipts
    "typing:start": (data: {
        channelId: string;
        userId: string;
        username: string;
    }) => void;

    "typing:stop": (data: {
        channelId: string;
        userId: string;
    }) => void;

    "message:read": (data: {
        channelId: string;
        userId: string;
        lastReadMessageId: string;
        timestamp: string;
    }) => void;

    "task:created": (data: {
        taskId: string;
        channelId: string;
        createdByUserId: string;
        assignedToUserId: string | null;
        title: string;
        description: string | null;
        dueDate: string | null;
        priority: "low" | "medium" | "high";
        status: "new" | "in_progress" | "completed";
        createdAt: string;
        updatedAt: string;
    }) => void;

    "task:updated": (data: {
        taskId: string;
        channelId: string;
        assignedToUserId: string | null;
        title: string;
        description: string | null;
        dueDate: string | null;
        priority: "low" | "medium" | "high";
        status: "new" | "in_progress" | "completed";
        updatedAt: string;
    }) => void;

    "task:deleted": (data: {
        taskId: string;
        channelId: string;
    }) => void;

    "task:status": (data: {
        taskId: string;
        status: "new" | "in_progress" | "completed";
    }) => void;

    "task:assigned": (data: {
        taskId: string;
        channelId: string;
        title: string;
        dueDate: string | null;
        priority: "low" | "medium" | "high";
    }) => void;
};

// Events from client to server
export type ClientToServerEvents = {
    // Join/leave channel
    "channel:join": (channelId: string, callback: (success: boolean) => void) => void;
    "channel:leave": (channelId: string, callback: (success: boolean) => void) => void;

    // Typing indicators
    "typing:start": (channelId: string) => void;
    "typing:stop": (channelId: string) => void;

    // Mark messages as read
    "message:read": (channelId: string, messageId: string) => void;

    "task:status:change": (taskId: string, status: "new" | "in_progress" | "completed", callback: (success: boolean) => void) => void;
};

// Server to server events (if using multiple servers)
export type InterServerEvents = {
    ping: () => void;
};

// Additional data stored in socket
export type SocketData = {
    user?: {
        id: string;
        username: string;
        name: string;
        surname: string;
    };
    sessionId?: string;
    authenticated: boolean;
    joinedChannels?: string[];
};

export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
