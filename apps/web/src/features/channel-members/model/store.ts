import type { ChannelMember } from "#/shared/api/channels/types";

import { channelsService } from "#/shared/api/channels";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { create } from "zustand";

type UserInfo = {
    id: string;
    username: string;
    name: string;
    surname: string;
    avatar?: string;
};

type ChannelMembersState = {
    members: ChannelMember[];
    users: Record<string, UserInfo>;
    activeUsers: string[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;
    pollingInterval: number | null;

    setCurrentChannel: (channelId: string) => void;
    fetchChannelMembers: (channelId: string) => Promise<void>;
    fetchActiveUsers: (channelId: string) => Promise<void>;
    startActiveUsersPolling: (channelId: string, intervalMs?: number) => void;
    stopActiveUsersPolling: () => void;
    getUserInfo: (userId: string) => UserInfo | undefined;
    isUserActive: (userId: string) => boolean;
};

export const useChannelMembersStore = create<ChannelMembersState>((set, get) => ({
    members: [],
    users: {},
    activeUsers: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    currentChannelId: null,
    pollingInterval: null,

    setCurrentChannel: (channelId) => {
        // Clear previous polling interval if exists
        const { pollingInterval, stopActiveUsersPolling } = get();
        if (pollingInterval) {
            stopActiveUsersPolling();
        }

        set({
            currentChannelId: channelId,
            members: [],
            totalCount: 0,
            isLoading: false,
        });
    },

    fetchChannelMembers: async (channelId) => {
        set({ isLoading: true, error: null });

        try {
            const { count, data } = await channelsService.getChannelMembers(channelId);

            // Создаем кеш пользователей из полученных данных о членах канала
            const users: Record<string, UserInfo> = {};
            data.forEach((member) => {
                if (member.user) {
                    users[member.userId] = {
                        id: member.userId,
                        username: member.user.username,
                        name: member.user.name,
                        surname: member.user.surname,
                        // Use Dicebear for avatar if user doesn't have a custom one
                        avatar: getUserAvatarUrl(member.userId),
                    };
                }
            });

            set({
                members: data,
                totalCount: count,
                isLoading: false,
                currentChannelId: channelId,
                users: { ...get().users, ...users },
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch channel members.",
            });
            throw error;
        }
    },

    fetchActiveUsers: async (channelId) => {
        try {
            const activeUsers = await channelsService.getChannelActiveUsers(channelId);
            set({ activeUsers });
        }
        catch (error) {
            console.error("Failed to fetch active users:", error);
            // Don't set error state to avoid UI disruption for polling
        }
    },

    startActiveUsersPolling: (channelId, intervalMs = 30000) => {
        // Clear any existing interval
        const { pollingInterval, stopActiveUsersPolling } = get();
        if (pollingInterval) {
            stopActiveUsersPolling();
        }

        // Fetch immediately
        get().fetchActiveUsers(channelId);

        // Start polling
        const interval = window.setInterval(() => {
            get().fetchActiveUsers(channelId);
        }, intervalMs);

        set({ pollingInterval: interval });
    },

    stopActiveUsersPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
            window.clearInterval(pollingInterval);
            set({ pollingInterval: null });
        }
    },

    getUserInfo: (userId) => {
        return get().users[userId];
    },

    isUserActive: (userId) => {
        return get().activeUsers.includes(userId);
    },
}));

// Экспортируем хук для удобного доступа к информации о пользователях
export const useUsers = () => {
    const { users, getUserInfo, fetchChannelMembers, isUserActive } = useChannelMembersStore();
    return { users, getUserInfo, fetchChannelMembers, isUserActive };
};
