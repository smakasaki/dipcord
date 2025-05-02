import type { Socket } from "socket.io-client";

import { io } from "socket.io-client";

// Types matching the server-side definitions
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

    // Typing indicators
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

// Socket type with correct event types
export type SocketClientType = Socket<ServerToClientEvents, ClientToServerEvents>;

// Use the same proxy path that's configured in vite.config.mts
const API_PATH = "/api";

class SocketService {
    private socket: SocketClientType | null = null;
    private channelIds: Set<string> = new Set();
    private connectionAttempts = 0;
    private maxReconnectAttempts = 5;

    // Initialize the socket connection
    connect(token?: string): SocketClientType {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        // Use the proxy path instead of specifying a full URL
        // This ensures the WebSocket connection goes through the same proxy as API requests
        this.socket = io({
            autoConnect: true,
            withCredentials: true,
            path: `${API_PATH}/socket.io`, // Correctly specify the Socket.IO path with the proxy prefix
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: token ? { token } : undefined,
            transports: ["websocket", "polling"],
        });

        this.setupConnectionListeners();
        return this.socket;
    }

    // Join a channel
    joinChannel(channelId: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.socket || !this.socket.connected) {
                resolve(false);
                return;
            }

            this.socket.emit("channel:join", channelId, (success) => {
                if (success) {
                    this.channelIds.add(channelId);
                }
                resolve(success);
            });
        });
    }

    // Leave a channel
    leaveChannel(channelId: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.socket || !this.socket.connected) {
                resolve(false);
                return;
            }

            this.socket.emit("channel:leave", channelId, (success) => {
                if (success) {
                    this.channelIds.delete(channelId);
                }
                resolve(success);
            });
        });
    }

    // Start typing indicator
    startTyping(channelId: string): void {
        if (!this.socket || !this.socket.connected)
            return;
        this.socket.emit("typing:start", channelId);
    }

    // Stop typing indicator
    stopTyping(channelId: string): void {
        if (!this.socket || !this.socket.connected)
            return;
        this.socket.emit("typing:stop", channelId);
    }

    // Mark message as read
    markMessageAsRead(channelId: string, messageId: string): void {
        if (!this.socket || !this.socket.connected)
            return;
        this.socket.emit("message:read", channelId, messageId);
    }

    // Change task status
    changeTaskStatus(taskId: string, status: "new" | "in_progress" | "completed"): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.socket || !this.socket.connected) {
                resolve(false);
                return;
            }

            this.socket.emit("task:status:change", taskId, status, (success) => {
                resolve(success);
            });
        });
    }

    // Disconnect socket
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.channelIds.clear();
        }
    }

    // Add event listener
    on<T extends keyof ServerToClientEvents>(
        event: T,
        callback: ServerToClientEvents[T],
    ): void {
        if (!this.socket)
            return;
        this.socket.on(event, callback as any);
    }

    // Remove event listener
    off<T extends keyof ServerToClientEvents>(event: T): void {
        if (!this.socket)
            return;
        this.socket.off(event);
    }

    private setupConnectionListeners(): void {
        if (!this.socket)
            return;

        this.socket.on("connect", () => {
            this.connectionAttempts = 0;

            // Rejoin channels on reconnect
            this.channelIds.forEach((channelId) => {
                this.joinChannel(channelId);
            });
        });

        this.socket.on("disconnect", () => {
            // Connection lost
        });

        this.socket.on("connect_error", () => {
            this.connectionAttempts++;

            if (this.connectionAttempts >= this.maxReconnectAttempts) {
                this.socket?.disconnect();
            }
        });
    }

    // Get the socket instance
    getSocket(): SocketClientType | null {
        return this.socket;
    }
}

// Export singleton instance
export const socketService = new SocketService();
