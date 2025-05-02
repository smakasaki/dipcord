// src/features/channel-tasks/model/selectors.ts

import type { Task, TaskStatus } from "#/shared/api/tasks/types";

import { useTasksStore } from "./store";

// Basic state selectors
export const useTasks = () => useTasksStore(state => state.tasks);
export const useTasksLoading = () => useTasksStore(state => state.isLoading);
export const useTasksError = () => useTasksStore(state => state.error);
export const useTotalTasksCount = () => useTasksStore(state => state.totalCount);
export const useCurrentChannelId = () => useTasksStore(state => state.currentChannelId);
export const useSelectedTaskId = () => useTasksStore(state => state.selectedTaskId);
export const useViewMode = () => useTasksStore(state => state.viewMode);
export const useFilterMyTasks = () => useTasksStore(state => state.filterMyTasks);
export const useFilterStatus = () => useTasksStore(state => state.filterStatus);
export const useSearchQuery = () => useTasksStore(state => state.searchQuery);
export const useSortBy = () => useTasksStore(state => state.sortBy);

// Complex selectors
export const useTasksByStatus = (): Record<TaskStatus, Task[]> => {
    const tasks = useTasksStore(state => state.tasks);

    const groupedTasks: Record<TaskStatus, Task[]> = {
        new: [],
        in_progress: [],
        completed: [],
    };

    tasks.forEach((task) => {
        groupedTasks[task.status].push(task);
    });

    return groupedTasks;
};

export const useSelectedTask = (): Task | undefined => {
    const tasks = useTasksStore(state => state.tasks);
    const selectedTaskId = useTasksStore(state => state.selectedTaskId);

    return tasks.find(task => task.id === selectedTaskId);
};

export const useTasksCountByStatus = (): Record<TaskStatus, number> => {
    const tasksByStatus = useTasksByStatus();

    return {
        new: tasksByStatus.new.length,
        in_progress: tasksByStatus.in_progress.length,
        completed: tasksByStatus.completed.length,
    };
};
