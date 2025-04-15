import type { GetUserChannelsParams } from "#/shared/api/channels";

import { useCallback } from "react";

import { useChannelsStore } from "./store";

export const useFetchUserChannels = () => {
    const fetchUserChannels = useChannelsStore(state => state.fetchUserChannels);
    const isLoading = useChannelsStore(state => state.isLoading);

    const getUserChannels = useCallback(
        async (params?: GetUserChannelsParams) => {
            try {
                await fetchUserChannels(params);
                return true;
            }
            catch (error) {
                return false;
            }
        },
        [fetchUserChannels],
    );

    return { getUserChannels, isLoading };
};
