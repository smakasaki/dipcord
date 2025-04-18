import type { Poll } from "#/entities/poll";

export const generateMockPolls = (channelId: string): Poll[] => {
    const now = new Date();

    return [
        {
            id: "poll-1",
            channelId,
            createdByUserId: "user-1",
            title: "What project should we prioritize next?",
            description: "Please vote for what you think should be our team's focus for the upcoming sprint.",
            options: [
                { id: "option-1-1", text: "Mobile app redesign", votes: 5, voters: ["user-2", "user-3", "user-4", "user-5", "user-6"] },
                { id: "option-1-2", text: "New landing page", votes: 3, voters: ["user-7", "user-8", "user-9"] },
                { id: "option-1-3", text: "API improvements", votes: 8, voters: ["user-10", "user-11", "user-12", "user-13", "user-14", "user-15", "user-16", "user-17"] },
                { id: "option-1-4", text: "Bug fixes", votes: 0, voters: [] },
            ],
            type: "public",
            status: "active",
            expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
            totalVotes: 16,
        },
        {
            id: "poll-2",
            channelId,
            createdByUserId: "user-2",
            title: "Team lunch preferences",
            description: "Where should we go for our team lunch next Friday?",
            options: [
                { id: "option-2-1", text: "Italian restaurant", votes: 4 },
                { id: "option-2-2", text: "Sushi bar", votes: 7 },
                { id: "option-2-3", text: "Mexican grill", votes: 2 },
                { id: "option-2-4", text: "Salad place", votes: 1 },
            ],
            type: "anonymous",
            status: "active",
            expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24), // 1 day from now
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12), // 12 hours ago
            totalVotes: 14,
        },
        {
            id: "poll-3",
            channelId,
            createdByUserId: "user-3",
            title: "Best meeting time",
            description: "What time works best for our regular team meetings?",
            options: [
                { id: "option-3-1", text: "Morning (9-10 AM)", votes: 6 },
                { id: "option-3-2", text: "Afternoon (2-3 PM)", votes: 4 },
                { id: "option-3-3", text: "Evening (4-5 PM)", votes: 2 },
            ],
            type: "public",
            status: "completed",
            expiresAt: null, // Manually ended
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
            totalVotes: 12,
        },
    ];
};
