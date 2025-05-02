import type { CreatePollData, Poll, PollStatus, VotePollData } from "#/entities/poll";

import { create } from "zustand";

import { generateMockPolls } from "./mock";

// Function to generate unique IDs using built-in browser API
const generateId = () => {
    // Use crypto.randomUUID if available, otherwise create a simple timestamp-based ID
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

type PollsState = {
    polls: Poll[];
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;

    // Actions
    setCurrentChannel: (channelId: string) => void;
    fetchPolls: (channelId: string) => Promise<void>;
    createPoll: (channelId: string, pollData: CreatePollData) => Promise<Poll | null>;
    votePoll: (voteData: VotePollData) => Promise<boolean>;
    endPoll: (pollId: string) => Promise<boolean>;
    setError: (error: string | null) => void;
};

export const usePollsStore = create<PollsState>((set, get) => ({
    polls: [],
    isLoading: false,
    error: null,
    currentChannelId: null,

    setCurrentChannel: (channelId) => {
        set({
            currentChannelId: channelId,
            polls: [],
            error: null,
        });
    },

    fetchPolls: async (channelId) => {
        set({ isLoading: true, error: null });

        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            const mockPolls = generateMockPolls(channelId);

            set({
                polls: mockPolls,
                isLoading: false,
                currentChannelId: channelId,
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to fetch polls.",
            });
        }
    },

    createPoll: async (channelId, pollData) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            const newPoll: Poll = {
                id: generateId(),
                channelId,
                createdByUserId: "current-user", // In a real app, this would come from auth
                title: pollData.title,
                description: pollData.description,
                options: pollData.options.map(optionText => ({
                    id: generateId(),
                    text: optionText,
                    votes: 0,
                    voters: [],
                })),
                type: pollData.type,
                status: "active",
                expiresAt: pollData.expiresAt,
                createdAt: new Date(),
                totalVotes: 0,
            };

            set(state => ({
                polls: [newPoll, ...state.polls],
                isLoading: false,
            }));

            return newPoll;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to create poll.",
            });
            return null;
        }
    },

    votePoll: async (voteData) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const { pollId, optionId } = voteData;
            const { polls } = get();

            const pollIndex = polls.findIndex(p => p.id === pollId);
            if (pollIndex === -1) {
                throw new Error("Poll not found");
            }

            const poll = polls[pollIndex]!;

            // Check if poll is still active
            if (poll.status !== "active") {
                throw new Error("This poll has ended");
            }

            // Check if user already voted
            if (poll.userVote !== undefined) {
                throw new Error("You have already voted in this poll");
            }

            // Update poll with the vote
            const updatedPoll = { ...poll };
            const optionIndex = updatedPoll.options.findIndex(o => o.id === optionId);

            if (optionIndex === -1) {
                throw new Error("Option not found");
            }

            // Increment vote count
            updatedPoll.options[optionIndex]!.votes += 1;

            // For public polls, store the voter ID
            if (updatedPoll.type === "public") {
                updatedPoll.options[optionIndex]!.voters = [
                    ...(updatedPoll.options[optionIndex]!.voters || []),
                    "current-user",
                ];
            }

            // Store user's vote and update total
            updatedPoll.userVote = optionId;
            updatedPoll.totalVotes += 1;

            // Update polls array
            const updatedPolls = [...polls];
            updatedPolls[pollIndex] = updatedPoll;

            set({
                polls: updatedPolls,
                isLoading: false,
            });

            return true;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to vote in poll.",
            });
            return false;
        }
    },

    endPoll: async (pollId) => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 600));

            const { polls } = get();

            const pollIndex = polls.findIndex(p => p.id === pollId);
            if (pollIndex === -1) {
                throw new Error("Poll not found");
            }

            // Mark poll as completed
            const updatedPolls = [...polls];
            updatedPolls[pollIndex] = {
                ...updatedPolls[pollIndex]!,
                status: "completed" as PollStatus,
            };

            set({
                polls: updatedPolls,
                isLoading: false,
            });

            return true;
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to end poll.",
            });
            return false;
        }
    },

    setError: error => set({ error }),
}));
