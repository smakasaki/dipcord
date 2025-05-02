import type { ActiveCall, Call } from "#/entities/call";

import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { create } from "zustand";

type CallsState = {
    calls: Call[];
    activeCall: ActiveCall | null;
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;

    // Actions
    setCurrentChannel: (channelId: string) => void;
    fetchCalls: (channelId: string) => Promise<void>;
    startCall: (channelId: string, type: "audio" | "video") => Promise<ActiveCall | null>;
    endCall: (callId: string) => Promise<boolean>;
    joinCall: (callId: string) => Promise<ActiveCall | null>;
    leaveCall: () => void;
};

// Mock data for calls
const mockCalls: Call[] = [
    {
        id: "call-1",
        channelId: "f45af451-b7ef-43e4-f708-3e87ffb9216b",
        title: "Weekly Team Sync",
        type: "video",
        status: "completed",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45), // 45 min duration
        initiatedBy: {
            id: "user-1",
            name: "Maria Kim",
        },
        participants: 6,
    },
    {
        id: "call-2",
        channelId: "f45af451-b7ef-43e4-f708-3e87ffb9216b",
        title: "Project Planning",
        type: "video",
        status: "completed",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 60), // 60 min duration
        initiatedBy: {
            id: "user-2",
            name: "Alex Smith",
        },
        participants: 4,
    },
    {
        id: "call-3",
        channelId: "f45af451-b7ef-43e4-f708-3e87ffb9216b",
        title: "Quick Discussion",
        type: "audio",
        status: "completed",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 2.5), // 30 min duration
        initiatedBy: {
            id: "user-3",
            name: "John Doe",
        },
        participants: 2,
    },
    {
        id: "call-4",
        channelId: "f45af451-b7ef-43e4-f708-3e87ffb9216b", // Different channel
        title: "Marketing Strategy",
        type: "video",
        status: "completed",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 47), // 1 hour duration
        initiatedBy: {
            id: "user-4",
            name: "Sarah Johnson",
        },
        participants: 5,
    },
];

// Mock active call data
const mockActiveCall: ActiveCall = {
    id: "active-call-1",
    channelId: "f45af451-b7ef-43e4-f708-3e87ffb9216b",
    title: "Current Discussion",
    type: "video",
    startTime: new Date(Date.now() - 1000 * 60 * 10), // Started 10 minutes ago
    participants: [
        {
            id: "user-1",
            name: "Maria Kim",
            avatar: getUserAvatarUrl("user-1"),
            isMuted: false,
            isSpeaking: true,
            isVideoOn: true,
        },
        {
            id: "user-2",
            name: "Alex Smith",
            avatar: getUserAvatarUrl("user-2"),
            isMuted: false,
            isSpeaking: false,
            isVideoOn: true,
        },
        {
            id: "user-3",
            name: "John Doe",
            avatar: getUserAvatarUrl("user-3"),
            isMuted: false,
            isSpeaking: false,
            isVideoOn: false,
        },
    ],
    // Use a public Daily.co room URL - this should be replaced with your actual URL
    roomUrl: "https://dipcord.daily.co/demo-room",
};

export const useCallsStore = create<CallsState>((set, get) => ({
    calls: [],
    activeCall: null,
    isLoading: false,
    error: null,
    currentChannelId: null,

    setCurrentChannel: (channelId) => {
        set({
            currentChannelId: channelId,
            calls: [],
            activeCall: null,
        });
    },

    fetchCalls: async (channelId) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Filter mock calls for this channel
            const channelCalls = mockCalls.filter(call => call.channelId === channelId);

            // Determine if there's an active call for this channel
            const activeCallForChannel
                = channelId === mockActiveCall.channelId ? mockActiveCall : null;

            set({
                calls: channelCalls,
                activeCall: activeCallForChannel,
                isLoading: false,
                currentChannelId: channelId,
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch calls.",
            });
        }
    },

    startCall: async (channelId, type) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Create a new active call
            const newActiveCall: ActiveCall = {
                ...mockActiveCall,
                id: `call-${Date.now()}`,
                channelId,
                type,
                startTime: new Date(),
                // Only include current user initially
                participants: [
                    {
                        id: "current-user",
                        name: "You",
                        avatar: getUserAvatarUrl("current-user"),
                        isMuted: false,
                        isSpeaking: false,
                        isVideoOn: type === "video",
                    },
                ],
            };

            set({
                activeCall: newActiveCall,
                isLoading: false,
            });

            return newActiveCall;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to start call.",
            });
            return null;
        }
    },

    endCall: async (callId) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const { activeCall, currentChannelId } = get();

            // Only end the call if it matches the active call
            if (activeCall && activeCall.id === callId) {
                // Create a completed call entry
                const completedCall: Call = {
                    id: activeCall.id,
                    channelId: activeCall.channelId,
                    title: activeCall.title,
                    type: activeCall.type,
                    status: "completed",
                    startTime: activeCall.startTime,
                    endTime: new Date(),
                    initiatedBy: {
                        id: "current-user",
                        name: "You",
                    },
                    participants: activeCall.participants.length,
                };

                set(state => ({
                    activeCall: null,
                    calls: [completedCall, ...state.calls],
                    isLoading: false,
                }));

                return true;
            }

            set({ isLoading: false });
            return false;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to end call.",
            });
            return false;
        }
    },

    joinCall: async (callId) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            // In a real implementation, would connect to the call
            // For now, just return the active call
            const { activeCall } = get();

            if (activeCall && activeCall.id === callId) {
                // Add current user to participants if not already there
                if (!activeCall.participants.some(p => p.id === "current-user")) {
                    const updatedCall = {
                        ...activeCall,
                        participants: [
                            ...activeCall.participants,
                            {
                                id: "current-user",
                                name: "You",
                                avatar: getUserAvatarUrl("current-user"),
                                isMuted: false,
                                isSpeaking: false,
                                isVideoOn: activeCall.type === "video",
                            },
                        ],
                    };

                    set({
                        activeCall: updatedCall,
                        isLoading: false,
                    });

                    return updatedCall;
                }

                set({ isLoading: false });
                return activeCall;
            }

            set({ isLoading: false });
            return null;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to join call.",
            });
            return null;
        }
    },

    leaveCall: () => {
        const { activeCall } = get();

        if (activeCall) {
            // Remove current user from participants
            const updatedParticipants = activeCall.participants.filter(
                p => p.id !== "current-user",
            );

            // If there are still participants, update the call
            if (updatedParticipants.length > 0) {
                set({
                    activeCall: {
                        ...activeCall,
                        participants: updatedParticipants,
                    },
                });
            }
            else {
                // If no participants left, end the call
                get().endCall(activeCall.id);
            }
        }
    },
}));
