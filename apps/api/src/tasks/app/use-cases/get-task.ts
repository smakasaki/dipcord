import { ForbiddenError, NotFoundError } from "#commons/app/errors.js";

import type { GetTaskParams, GetTaskUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, TaskRepository } from "../ports/outgoing.js";

export function createGetTaskUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
): GetTaskUseCase {
    return {
        async execute(params: GetTaskParams) {
            const { userId, taskId } = params;

            const task = await taskRepository.findTaskById(taskId);
            if (!task) {
                throw new NotFoundError(`Task with ID ${taskId} not found`);
            }

            const isMember = await channelMemberRepository.isUserChannelMember(
                userId,
                task.channelId,
            );

            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            return task;
        },
    };
}
