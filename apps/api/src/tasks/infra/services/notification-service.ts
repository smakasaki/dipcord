import type { Task } from "@dipcord/domain";
import type { FastifyInstance } from "fastify";

import type { NotificationService } from "../../app/ports/outgoing.js";

/**
 * WebSocket Notification Service for Task events
 * Sends real-time updates to clients via WebSockets
 */
export class WebSocketTaskNotificationService implements NotificationService {
    /**
     * Create a new WebSocketTaskNotificationService
     * @param fastify Fastify instance with websocket decorations
     */
    constructor(private readonly fastify: FastifyInstance) {}

    /**
     * Notify about task creation
     * @param task Created task
     */
    async notifyTaskCreated(task: Task): Promise<void> {
        try {
            this.fastify.broadcastToChannel(task.channelId, "task:created", {
                taskId: task.id,
                channelId: task.channelId,
                createdByUserId: task.createdByUserId,
                assignedToUserId: task.assignedToUserId,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                priority: task.priority,
                status: task.status,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
            });

            // If task is assigned to someone, also notify that user directly
            if (task.assignedToUserId) {
                this.fastify.broadcastToUser(task.assignedToUserId, "task:assigned", {
                    taskId: task.id,
                    channelId: task.channelId,
                    title: task.title,
                    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                    priority: task.priority,
                });
            }
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify task created");
        }
    }

    /**
     * Notify about task update
     * @param task Updated task
     */
    async notifyTaskUpdated(task: Task): Promise<void> {
        try {
            this.fastify.broadcastToChannel(task.channelId, "task:updated", {
                taskId: task.id,
                channelId: task.channelId,
                assignedToUserId: task.assignedToUserId,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                priority: task.priority,
                status: task.status,
                updatedAt: task.updatedAt.toISOString(),
            });

            // If task status changed, send a status update event
            this.fastify.broadcastToChannel(task.channelId, "task:status", {
                taskId: task.id,
                status: task.status,
            });
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify task updated");
        }
    }

    /**
     * Notify about task deletion
     * @param task Deleted task
     */
    async notifyTaskDeleted(task: Task): Promise<void> {
        try {
            this.fastify.broadcastToChannel(task.channelId, "task:deleted", {
                taskId: task.id,
                channelId: task.channelId,
            });
        }
        catch (error) {
            this.fastify.log.error(error, "Failed to notify task deleted");
        }
    }
}
