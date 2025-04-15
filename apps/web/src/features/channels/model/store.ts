import type { Channel } from "#/entities/channel";
import type { GetUserChannelsParams } from "#/shared/api/channels";

import { channelsService } from "#/shared/api/channels";
import { create } from "zustand";

type ChannelsState = {
    channels: Channel[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    fetchUserChannels: (params?: GetUserChannelsParams) => Promise<void>;
    setError: (error: string | null) => void;
};

export const useChannelsStore = create<ChannelsState>(set => ({
    channels: [],
    totalCount: 0,
    isLoading: false,
    error: null,

    setError: (error: string | null) => set({ error }),

    fetchUserChannels: async (params) => {
        set({ isLoading: true, error: null });

        try {
            const { count, data } = await channelsService.getUserChannels(params);

            set({
                channels: data,
                totalCount: count,
                isLoading: false,
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch channels.",
            });
            throw error;
        }
    },
}));
