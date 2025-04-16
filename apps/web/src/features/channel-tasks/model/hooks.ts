import type { CreateTaskRequest, TaskStatus, UpdateTaskRequest } from "#/shared/api/tasks/types";

import { useAuthStore } from "#/features/auth";
import { useCallback } from "react";

import { useTasksStore } from "./store";

export const useTaskActions = () => {
    const {
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        setViewMode,
        setFilterMyTasks,
        setFilterStatus,
        setSearchQuery,
        setSortBy,
        selectTask,
        currentChannelId,
        setCurrentChannel,
    } = useTasksStore();

    const refreshTasks = useCallback(() => {
        if (currentChannelId) {
            return fetchTasks(currentChannelId);
        }
        return Promise.resolve();
    }, [fetchTasks, currentChannelId]);

    const handleCreateTask = useCallback(async (taskData: CreateTaskRequest) => {
        const result = await createTask(taskData);
        return result;
    }, [createTask]);

    const handleUpdateTask = useCallback(async (taskId: string, taskData: UpdateTaskRequest) => {
        const result = await updateTask(taskId, taskData);
        return result;
    }, [updateTask]);

    const handleUpdateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
        const result = await updateTaskStatus(taskId, status);
        return result;
    }, [updateTaskStatus]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        const result = await deleteTask(taskId);
        return result;
    }, [deleteTask]);

    const handleSelectTask = useCallback((taskId: string | null) => {
        selectTask(taskId);
    }, [selectTask]);

    return {
        refreshTasks,
        createTask: handleCreateTask,
        updateTask: handleUpdateTask,
        updateTaskStatus: handleUpdateTaskStatus,
        deleteTask: handleDeleteTask,
        setViewMode,
        setFilterMyTasks,
        setFilterStatus,
        setSearchQuery,
        setSortBy,
        selectTask: handleSelectTask,
        setCurrentChannel,
    };
};

export const useTaskPermissions = () => {
    const { user } = useAuthStore();
    const userId = user?.id || "";

    const canEditTask = (createdByUserId: string, assignedToUserId: string | null) => {
        // Admin/moderator can edit any task (roles should come from user object)
        const isAdminOrModerator = user?.roles?.some(role => ["admin", "moderator"].includes(role)) || false;

        // Users can edit their own tasks or tasks assigned to them
        return isAdminOrModerator || userId === createdByUserId || userId === assignedToUserId;
    };

    const canDeleteTask = (createdByUserId: string) => {
        // Admin/moderator can delete any task
        const isAdminOrModerator = user?.roles?.some(role => ["admin", "moderator"].includes(role)) || false;

        // Users can only delete their own tasks
        return isAdminOrModerator || userId === createdByUserId;
    };

    const canChangeTaskStatus = (assignedToUserId: string | null) => {
        // Admin/moderator can change any task status
        const isAdminOrModerator = user?.roles?.some(role => ["admin", "moderator"].includes(role)) || false;

        // Users can change status of tasks assigned to them
        return isAdminOrModerator || userId === assignedToUserId;
    };

    return {
        canEditTask,
        canDeleteTask,
        canChangeTaskStatus,
    };
};
