import { useCallback } from "react";

import { useCallsStore } from "./store";

export const useCallActions = () => {
    const {
        fetchCalls,
        startCall,
        endCall,
        joinCall,
        leaveCall,
        setCurrentChannel,
        currentChannelId,
    } = useCallsStore();

    const refreshCalls = useCallback(() => {
        if (currentChannelId) {
            return fetchCalls(currentChannelId);
        }
        return Promise.resolve();
    }, [fetchCalls, currentChannelId]);

    return {
        refreshCalls,
        startCall,
        endCall,
        joinCall,
        leaveCall,
        setCurrentChannel,
    };
};
