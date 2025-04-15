import { useChannelsStore } from "./store";

export const useChannels = () => useChannelsStore(state => state.channels);
export const useTotalChannelsCount = () => useChannelsStore(state => state.totalCount);
export const useChannelsLoading = () => useChannelsStore(state => state.isLoading);
export const useChannelsError = () => useChannelsStore(state => state.error);
