import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { UpdateTaskParams, UpdateTaskUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, NotificationService, TaskRepository } from "../ports/outgoing.js";

export function createUpdateTaskUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
    notificationService: NotificationService,
): UpdateTaskUseCase {
    return {
        async execute(params: UpdateTaskParams) {
            const { userId, taskId, data } = params;

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

            const hasEditPermission
                = task.createdByUserId === userId
                    || task.assignedToUserId === userId
                    || userPermissions.role === "owner"
                    || userPermissions.role === "moderator"
                    || (userPermissions.permissions?.manage_tasks === true);

            if (!hasEditPermission) {
                throw new ForbiddenError("You don't have permission to update this task");
            }

            // If changing assignee, check if new assignee is a member of the channel
            if (data.assignedToUserId && data.assignedToUserId !== task.assignedToUserId) {
                const isAssigneeMember = await channelMemberRepository.isUserChannelMember(
                    data.assignedToUserId,
                    task.channelId,
                );

                if (!isAssigneeMember) {
                    throw new ForbiddenError("Assignee is not a member of this channel");
                }
            }

            const updatedTask = await taskRepository.updateTask(taskId, data);

            await notificationService.notifyTaskUpdated(updatedTask);

            return updatedTask;
        },
    };
}
