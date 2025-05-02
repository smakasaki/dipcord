// src/features/channel-tasks/model/store.ts

import type { CreateTaskRequest, Task, TaskPriority, TaskStatus, UpdateTaskRequest } from "#/shared/api/tasks/types";

import { socketService } from "#/shared/api/socket";
import { tasksService } from "#/shared/api/tasks";
import { create } from "zustand";

type TasksState = {
    tasks: Task[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;
    selectedTaskId: string | null;
    viewMode: "kanban" | "list";
    filterMyTasks: boolean;
    filterStatus: TaskStatus | null;
    searchQuery: string;
    sortBy: string;

    // Actions
    setCurrentChannel: (channelId: string) => void;
    fetchTasks: (channelId: string, params?: any) => Promise<void>;
    createTask: (taskData: CreateTaskRequest) => Promise<Task | null>;
    updateTask: (taskId: string, taskData: UpdateTaskRequest) => Promise<Task | null>;
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<Task | null>;
    deleteTask: (taskId: string) => Promise<boolean>;
    setViewMode: (mode: "kanban" | "list") => void;
    setFilterMyTasks: (filter: boolean) => void;
    setFilterStatus: (status: TaskStatus | null) => void;
    setSearchQuery: (query: string) => void;
    setSortBy: (sort: string) => void;
    selectTask: (taskId: string | null) => void;
    setError: (error: string | null) => void;
};

export const useTasksStore = create<TasksState>((set, get) => ({
    tasks: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    currentChannelId: null,
    selectedTaskId: null,
    viewMode: "kanban",
    filterMyTasks: false,
    filterStatus: null,
    searchQuery: "",
    sortBy: "dueDate.asc",

    setCurrentChannel: (channelId) => {
        set({
            currentChannelId: channelId,
            tasks: [],
            totalCount: 0,
            selectedTaskId: null,
        });

        // Register socket handlers for this channel
        const setupSocketHandlers = () => {
            socketService.on("task:created", (data) => {
                if (data.channelId === channelId) {
                    // Преобразуем формат данных с сервера, где используется taskId вместо id
                    const task: Task = {
                        id: data.taskId,
                        channelId: data.channelId,
                        createdByUserId: data.createdByUserId,
                        assignedToUserId: data.assignedToUserId,
                        title: data.title,
                        description: data.description,
                        dueDate: data.dueDate,
                        priority: data.priority,
                        status: data.status,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    };

                    set(state => ({
                        tasks: [task, ...state.tasks],
                        totalCount: state.totalCount + 1,
                    }));
                }
            });

            socketService.on("task:updated", (data) => {
                if (data.channelId === channelId) {
                    set(state => ({
                        tasks: state.tasks.map(task =>
                            task.id === data.taskId
                                ? {
                                        ...task,
                                        assignedToUserId: data.assignedToUserId,
                                        title: data.title,
                                        description: data.description,
                                        dueDate: data.dueDate,
                                        priority: data.priority,
                                        status: data.status,
                                        updatedAt: data.updatedAt,
                                    }
                                : task,
                        ),
                    }));
                }
            });

            socketService.on("task:deleted", (data) => {
                if (data.channelId === channelId) {
                    set(state => ({
                        tasks: state.tasks.filter(task => task.id !== data.taskId),
                        totalCount: state.totalCount - 1,
                        selectedTaskId: state.selectedTaskId === data.taskId ? null : state.selectedTaskId,
                    }));
                }
            });

            socketService.on("task:status", (data) => {
                set(state => ({
                    tasks: state.tasks.map(task =>
                        task.id === data.taskId ? { ...task, status: data.status } : task,
                    ),
                }));
            });
        };

        const socket = socketService.getSocket();
        if (socket && socket.connected) {
            setupSocketHandlers();
        }
        else {
            socketService.connect();
            setupSocketHandlers();
        }
    },

    fetchTasks: async (channelId, params = {}) => {
        const state = get();

        // Prepare query parameters based on filters
        const queryParams: any = { ...params };

        if (state.filterMyTasks) {
            queryParams.assignedToMe = true;
        }

        if (state.filterStatus) {
            queryParams.status = state.filterStatus;
        }

        if (state.searchQuery) {
            queryParams.query = state.searchQuery;
        }

        // Parse sort parameter
        if (state.sortBy) {
            const [field, direction] = state.sortBy.split(".");
            queryParams.sort = [`${field}.${direction}`];
        }

        set({ isLoading: true, error: null });

        try {
            const { count, data } = await tasksService.getTasks(channelId, queryParams);

            set({
                tasks: data,
                totalCount: count,
                isLoading: false,
                currentChannelId: channelId,
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch tasks.",
            });
            throw error;
        }
    },

    createTask: async (taskData) => {
        const { currentChannelId } = get();
        if (!currentChannelId)
            return null;

        set({ isLoading: true });

        try {
            const task = await tasksService.createTask(currentChannelId, taskData);

            // Don't add to state here as the task:created socket event will handle it

            set({ isLoading: false });
            return task;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to create task.",
            });
            throw error;
        }
    },

    updateTask: async (taskId, taskData) => {
        const { currentChannelId } = get();
        if (!currentChannelId)
            return null;

        set({ isLoading: true });

        try {
            const task = await tasksService.updateTask(currentChannelId, taskId, taskData);

            // Don't update state here as the task:updated socket event will handle it

            set({ isLoading: false });
            return task;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to update task.",
            });
            throw error;
        }
    },

    updateTaskStatus: async (taskId, status) => {
        const { currentChannelId } = get();
        if (!currentChannelId)
            return null;

        set({ isLoading: true });

        try {
            // Try to update via socket first for real-time updates
            const socketSuccess = await socketService.changeTaskStatus(taskId, status);

            // If socket fails, use REST API
            if (!socketSuccess) {
                const task = await tasksService.updateTaskStatus(currentChannelId, taskId, { status });

                // Update state manually since socket failed
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, status } : t,
                    ),
                    isLoading: false,
                }));

                return task;
            }

            set({ isLoading: false });

            // Return the updated task from the state
            return get().tasks.find(t => t.id === taskId) || null;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to update task status.",
            });
            throw error;
        }
    },

    deleteTask: async (taskId) => {
        const { currentChannelId } = get();
        if (!currentChannelId)
            return false;

        set({ isLoading: true });

        try {
            await tasksService.deleteTask(currentChannelId, taskId);

            // Don't update state here as the task:deleted socket event will handle it

            set({ isLoading: false });
            return true;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to delete task.",
            });
            throw error;
        }
    },

    setViewMode: mode => set({ viewMode: mode }),
    setFilterMyTasks: filter => set({ filterMyTasks: filter }),
    setFilterStatus: status => set({ filterStatus: status }),
    setSearchQuery: query => set({ searchQuery: query }),
    setSortBy: sort => set({ sortBy: sort }),
    selectTask: taskId => set({ selectedTaskId: taskId }),
    setError: error => set({ error }),
}));
