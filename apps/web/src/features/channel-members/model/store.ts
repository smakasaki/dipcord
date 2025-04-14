import type { ChannelMember } from "#/shared/api/channels/types";

import { channelsService } from "#/shared/api/channels";
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
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;

    setCurrentChannel: (channelId: string) => void;
    fetchChannelMembers: (channelId: string) => Promise<void>;
    getUserInfo: (userId: string) => UserInfo | undefined;
};

export const useChannelMembersStore = create<ChannelMembersState>((set, get) => ({
    members: [],
    users: {},
    totalCount: 0,
    isLoading: false,
    error: null,
    currentChannelId: null,

    setCurrentChannel: (channelId) => {
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

    getUserInfo: (userId) => {
        return get().users[userId];
    },
}));

// Экспортируем хук для удобного доступа к информации о пользователях
export const useUsers = () => {
    const { users, getUserInfo, fetchChannelMembers } = useChannelMembersStore();
    return { users, getUserInfo, fetchChannelMembers };
};
