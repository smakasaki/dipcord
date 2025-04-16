import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { DeleteTaskParams, DeleteTaskUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, NotificationService, TaskRepository } from "../ports/outgoing.js";

export function createDeleteTaskUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
    notificationService: NotificationService,
): DeleteTaskUseCase {
    return {
        async execute(params: DeleteTaskParams) {
            const { userId, taskId } = params;

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

            const hasDeletePermission
                = task.createdByUserId === userId
                    || userPermissions.role === "owner"
                    || userPermissions.role === "moderator"
                    || (userPermissions.permissions?.manage_tasks === true);

            if (!hasDeletePermission) {
                throw new ForbiddenError("You don't have permission to delete this task");
            }

            const deletedTask = await taskRepository.deleteTask(taskId);

            await notificationService.notifyTaskDeleted(deletedTask);

            return deletedTask;
        },
    };
}
