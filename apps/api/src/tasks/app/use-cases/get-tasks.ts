import { ForbiddenError } from "#commons/app/errors.js";

import type { GetTasksParams, GetTasksUseCase } from "../ports/incoming.js";
import type { ChannelMemberRepository, TaskRepository } from "../ports/outgoing.js";

export function createGetTasksUseCase(
    taskRepository: TaskRepository,
    channelMemberRepository: ChannelMemberRepository,
): GetTasksUseCase {
    return {
        async execute(params: GetTasksParams) {
            const { userId, filter, pagination, sortBy } = params;

            const isMember = await channelMemberRepository.isUserChannelMember(
                userId,
                filter.channelId,
            );

            if (!isMember) {
                throw new ForbiddenError("User is not a member of this channel");
            }

            return taskRepository.findTasks(filter, pagination, sortBy);
        },
    };
}
