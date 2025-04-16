import type { FastifyInstance } from "fastify";

import type { SocketType } from "./types.js";

export function registerSocketHandlers(fastify: FastifyInstance): void {
    fastify.io.on("connection", (socket: SocketType) => {
        const userId = socket.data.user?.id;

        if (!userId) {
            socket.disconnect();
            return;
        }

        // Join user's personal room for direct messages
        socket.join(`user:${userId}`);

        // Handle channel joining
        socket.on("channel:join", async (channelId, callback) => {
            try {
                // Verify if user is a member of the channel
                const isMember = await fastify.channelService.isUserChannelMember(userId, channelId);

                if (!isMember) {
                    callback(false);
                    return;
                }

                // Join the channel room
                socket.join(`channel:${channelId}`);

                // Keep track of joined channels
                if (!socket.data.joinedChannels) {
                    socket.data.joinedChannels = [];
                }

                if (!socket.data.joinedChannels.includes(channelId)) {
                    socket.data.joinedChannels.push(channelId);
                }

                // Notify other users that this user joined
                socket.to(`channel:${channelId}`).emit("channel:joined", {
                    channelId,
                    userId,
                    username: socket.data.user?.username || "",
                });

                callback(true);
            }
            catch (error) {
                fastify.log.error(error, `Error joining channel ${channelId}`);
                callback(false);
            }
        });

        // Handle channel leaving
        socket.on("channel:leave", async (channelId, callback) => {
            try {
                socket.leave(`channel:${channelId}`);

                // Update joined channels
                if (socket.data.joinedChannels) {
                    socket.data.joinedChannels = socket.data.joinedChannels.filter(id => id !== channelId);
                }

                // Notify other users that this user left
                // socket.to(`channel:${channelId}`).emit("channel:left", {
                //     channelId,
                //     userId,
                //     username: socket.data.user?.username || "",
                // });

                callback(true);
            }
            catch (error) {
                fastify.log.error(error, `Error leaving channel ${channelId}`);
                callback(false);
            }
        });

        // Handle typing indicators
        socket.on("typing:start", async (channelId) => {
            if (!socket.data.joinedChannels?.includes(channelId))
                return;

            socket.to(`channel:${channelId}`).emit("typing:start", {
                channelId,
                userId,
                username: socket.data.user?.username || "",
            });
        });

        socket.on("typing:stop", async (channelId) => {
            if (!socket.data.joinedChannels?.includes(channelId))
                return;

            socket.to(`channel:${channelId}`).emit("typing:stop", {
                channelId,
                userId,
            });
        });

        // Handle read receipts
        socket.on("message:read", async (channelId, messageId) => {
            if (!socket.data.joinedChannels?.includes(channelId))
                return;

            // Update last read message in database
            // This would typically go through a service, but shown here for simplicity
            try {
                await fastify.redis.hSet(`channel:${channelId}:read`, userId, messageId);

                // Broadcast to other users in channel
                socket.to(`channel:${channelId}`).emit("message:read", {
                    channelId,
                    userId,
                    lastReadMessageId: messageId,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                fastify.log.error(error, "Error updating read receipt");
            }
        });

        socket.on("task:status:change", async (taskId, status, callback) => {
            try {
                // Validate that the user has joined the channel where the task is
                // This is a simplified check - actual implementation would verify proper access
                if (!socket.data.joinedChannels || socket.data.joinedChannels.length === 0) {
                    callback(false);
                    return;
                }

                // Update task status through task service
                if (fastify.taskService) {
                    await fastify.taskService.updateTaskStatus({
                        userId,
                        taskId,
                        status,
                    });
                    callback(true);
                }
                else {
                    fastify.log.error("Task service not available");
                    callback(false);
                }
            }
            catch (error) {
                fastify.log.error(error, `Error updating task status for task ${taskId}`);
                callback(false);
            }
        });

        // Handle disconnect and cleanup
        socket.on("disconnect", async () => {

        });
    });
}
