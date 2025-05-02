import type { CreatePollData, Poll, VotePollData } from "#/entities/poll";

import { useCallback } from "react";

import { usePollsStore } from "./store";

// Basic state selectors
export const usePolls = () => usePollsStore(state => state.polls);
export const usePollsLoading = () => usePollsStore(state => state.isLoading);
export const usePollsError = () => usePollsStore(state => state.error);
export const useCurrentChannelId = () => usePollsStore(state => state.currentChannelId);

// Filter polls by status
export const useActivePolls = () => {
    const polls = usePollsStore(state => state.polls);
    return polls.filter(poll => poll.status === "active");
};

export const useCompletedPolls = () => {
    const polls = usePollsStore(state => state.polls);
    return polls.filter(poll => poll.status === "completed");
};

// Poll actions hook
export const usePollActions = () => {
    const {
        fetchPolls,
        createPoll,
        votePoll,
        endPoll,
        setCurrentChannel,
        currentChannelId,
        setError,
    } = usePollsStore();

    const refreshPolls = useCallback(() => {
        if (currentChannelId) {
            return fetchPolls(currentChannelId);
        }
        return Promise.resolve();
    }, [fetchPolls, currentChannelId]);

    const createNewPoll = useCallback(async (pollData: CreatePollData) => {
        if (!currentChannelId) {
            setError("No channel selected");
            return null;
        }
        return createPoll(currentChannelId, pollData);
    }, [createPoll, currentChannelId, setError]);

    return {
        refreshPolls,
        createPoll: createNewPoll,
        votePoll,
        endPoll,
        setCurrentChannel,
    };
};

// Check if a poll is expired
export const isPollExpired = (poll: Poll): boolean => {
    if (!poll.expiresAt)
        return false;
    return new Date() > new Date(poll.expiresAt);
};

// Get time remaining for a poll
export const getPollTimeRemaining = (poll: Poll): string => {
    if (!poll.expiresAt)
        return "No expiry";

    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);

    if (now > expiryDate)
        return "Expired";

    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
    }

    if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} left`;
    }

    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} left`;
};

// Check if user can end a poll (admin/moderator or creator)
export const canEndPoll = (poll: Poll, userId: string, userRoles?: string[]): boolean => {
    const isAdmin = userRoles?.includes("admin") || false;
    const isModerator = userRoles?.includes("moderator") || false;
    const isCreator = poll.createdByUserId === userId;

    return isAdmin || isModerator || isCreator;
};
