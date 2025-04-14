import { useMessagesStore } from "./store";

export const useMessages = () => useMessagesStore(state => state.messages);
export const useTotalMessagesCount = () => useMessagesStore(state => state.totalCount);
export const useMessagesLoading = () => useMessagesStore(state => state.isLoading);
export const useMessagesError = () => useMessagesStore(state => state.error);
export const useCurrentChannelId = () => useMessagesStore(state => state.currentChannelId);
