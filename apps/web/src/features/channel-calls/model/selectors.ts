import { useCallsStore } from "./store";

export const useCalls = () => useCallsStore(state => state.calls);
export const useActiveCall = () => useCallsStore(state => state.activeCall);
export const useCallsLoading = () => useCallsStore(state => state.isLoading);
export const useCallsError = () => useCallsStore(state => state.error);
export const useCurrentChannelId = () => useCallsStore(state => state.currentChannelId);
