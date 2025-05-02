import { BadRequestError, ForbiddenError } from "#commons/app/errors.js";

import type { CreateTaskParams, CreateTaskUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, NotificationService, TaskRepository } from "../ports/outgoing.js";

export function createCreateTaskUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
    notificationService: NotificationService,
): CreateTaskUseCase {
    return {
        async execute(params: CreateTaskParams) {
            const { userId, data } = params;

            const userPermissions = await channelMemberRepository.getUserPermissionsInChannel(
                userId,
                data.channelId,
            );

            if (!userPermissions) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            // If assignee is specified, check if they are a member of the channel
            if (data.assignedToUserId) {
                const isAssigneeMember = await channelMemberRepository.isUserChannelMember(
                    data.assignedToUserId,
                    data.channelId,
                );

                if (!isAssigneeMember) {
                    throw new BadRequestError("Assignee is not a member of this channel");
                }
            }

            const task = await taskRepository.createTask({
                ...data,
                createdByUserId: userId,
            });

            await notificationService.notifyTaskCreated(task);

            return task;
        },
    };
}
