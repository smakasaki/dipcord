import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { UpdateTaskStatusParams, UpdateTaskStatusUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, NotificationService, TaskRepository } from "../ports/outgoing.js";

// Add TaskUpdate type that includes status
type TaskUpdate = {
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
    priority?: "low" | "medium" | "high";
    assignedToUserId?: string | null;
    status?: string;
};

export function createUpdateTaskStatusUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
    notificationService: NotificationService,
): UpdateTaskStatusUseCase {
    return {
        async execute(params: UpdateTaskStatusParams) {
            const { userId, taskId, status } = params;

            const task = await taskRepository.findTaskById(taskId);
            if (!task) {
                throw new NotFoundError(`Task with ID ${taskId} not found`);
            }

            const userPermissions = await channelMemberRepository.getUserPermissionsInChannel(
                userId,
                task.channelId,
            );

            if (!userPermissions) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            // Check if user has permission to update status
            // Regular users can only update status of their assigned tasks
            const canUpdateStatus
                = task.assignedToUserId === userId // Assignee can change status
                    || userPermissions.role === "owner" // Owner can change status
                    || userPermissions.role === "moderator" // Moderator can change status
                    || (userPermissions.permissions?.manage_tasks === true); // User with manage_tasks permission

            if (!canUpdateStatus) {
                throw new ForbiddenError("You don't have permission to update this task's status");
            }

            // Update the task status
            const updatedTask = await taskRepository.updateTask(taskId, { status } as TaskUpdate);

            // Notify about task update
            await notificationService.notifyTaskUpdated(updatedTask);

            return updatedTask;
        },
    };
}
