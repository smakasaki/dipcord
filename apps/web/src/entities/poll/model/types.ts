export type PollOption = {
    id: string;
    text: string;
    votes: number;
    voters?: string[]; // For public polls, we can store voter IDs
};

export type PollType = "anonymous" | "public";

export type PollStatus = "active" | "completed";

export type Poll = {
    id: string;
    channelId: string;
    createdByUserId: string;
    title: string;
    description: string;
    options: PollOption[];
    type: PollType;
    status: PollStatus;
    expiresAt: Date | null;
    createdAt: Date;
    totalVotes: number;
    userVote?: string; // The option ID the current user voted for
};

// Data structures for poll operations
export type CreatePollData = {
    title: string;
    description: string;
    options: string[]; // Just the text for each option
    type: PollType;
    expiresAt: Date | null;
};

export type VotePollData = {
    pollId: string;
    optionId: string;
};
