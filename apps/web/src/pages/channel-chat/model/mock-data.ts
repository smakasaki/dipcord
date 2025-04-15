import type { Attachment, MessageType, Reaction, User } from "../../../entities/message";

type Channel = {
    id: string;
    name: string;
    topic: string;
    memberCount: number;
    onlineCount: number;
};

// Mock users for message generation
const mockUsers: User[] = [
    {
        id: "user-1",
        username: "AliceDev",
        avatar: "https://i.pravatar.cc/150?u=alice",
        role: "Admin",
    },
    {
        id: "user-2",
        username: "BobCoder",
        avatar: "https://i.pravatar.cc/150?u=bob",
    },
    {
        id: "user-3",
        username: "CharlieDesigner",
        avatar: "https://i.pravatar.cc/150?u=charlie",
        role: "Moderator",
    },
    {
        id: "user-4",
        username: "DanaDevOps",
        avatar: "https://i.pravatar.cc/150?u=dana",
    },
    {
        id: "current-user",
        username: "CurrentUser",
        avatar: "https://i.pravatar.cc/150?u=current-user",
    },
];

// Sample message contents for random generation
const sampleMessages = [
    "Hey everyone, how are you doing today?",
    "I just pushed a new feature to the repo. Can someone review it?",
    "Has anyone tried the new API endpoint?",
    "I think we should update our documentation for the latest changes.",
    "The design looks great! Nice work!",
    "Can someone help me with this error I'm getting?",
    "Just deployed the latest version to staging.",
    "Who's joining the call later?",
    "I found a bug in the authentication flow.",
    "Check out this resource I found: https://example.com/resource",
    "Should we discuss this in the next meeting?",
    "I'm working on fixing that issue from yesterday.",
    "Anyone have plans for the weekend?",
    "Let's set up a time to pair program tomorrow.",
    "The new UI looks amazing!",
    "I need some help with this React component.",
    "What do you think about switching to TypeScript?",
    "Just updated the README with better instructions.",
    "How do I run the E2E tests locally?",
    "I'm getting a weird error in the console.",
];

// Mock attachment types
const mockAttachmentTypes = [
    { name: "document.pdf", type: "application/pdf" },
    { name: "image.png", type: "image/png" },
    { name: "spreadsheet.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { name: "code.ts", type: "text/typescript" },
];

// Mock reactions
const mockReactions: Reaction[] = [
    { emoji: "👍", count: 2, users: ["user-1", "user-3"] },
    { emoji: "❤️", count: 1, users: ["user-2"] },
    { emoji: "🎉", count: 3, users: ["user-1", "user-2", "user-4"] },
    { emoji: "🔥", count: 2, users: ["user-3", "user-4"] },
];

/**
 * Generate a mock channel
 */
export function generateMockChannel(channelId: string): Channel {
    return {
        id: channelId,
        name: `general-${channelId.substring(0, 4)}`,
        topic: "General discussion about the project and team updates",
        memberCount: 32,
        onlineCount: 12,
    };
}

/**
 * Generate mock messages
 */
export function generateMockMessages(count: number, currentUserId: string, older = false): MessageType[] {
    const messages: MessageType[] = [];
    const baseTime = older ? new Date(Date.now() - 86400000) : new Date(); // 1 day ago for older messages

    for (let i = 0; i < count; i++) {
        const isCurrentUser = Math.random() > 0.7; // 30% chance of being the current user
        const author = isCurrentUser
            ? mockUsers.find(u => u.id === currentUserId)!
            : mockUsers[Math.floor(Math.random() * (mockUsers.length - 1))]; // Exclude current user

        const hasAttachments = Math.random() > 0.8; // 20% chance of having attachments
        const hasReactions = Math.random() > 0.7; // 30% chance of having reactions
        const isReply = Math.random() > 0.85 && messages.length > 0; // 15% chance of being a reply

        // Generate timestamp (newer messages have more recent timestamps)
        const timestamp = new Date(
            baseTime.getTime() - (older ? (count - i) * 600000 : i * 300000),
        ).toISOString();

        let attachments: Attachment[] | undefined;
        if (hasAttachments) {
            const attachmentType = mockAttachmentTypes[Math.floor(Math.random() * mockAttachmentTypes.length)];
            attachments = [{
                id: `attachment-${Date.now()}-${i}`,
                name: attachmentType.name,
                type: attachmentType.type,
                url: attachmentType.type.startsWith("image/")
                    ? `https://picsum.photos/seed/${i}/400/300`
                    : "#",
                size: Math.floor(Math.random() * 1000000),
            }];
        }

        // Create message
        const message: MessageType = {
            id: `msg-${Date.now()}-${i}`,
            content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
            author,
            timestamp,
            isEdited: Math.random() > 0.9, // 10% chance of being edited
            attachments,
            reactions: hasReactions ? [mockReactions[Math.floor(Math.random() * mockReactions.length)]] : undefined,
            replyTo: isReply ? messages[Math.floor(Math.random() * messages.length)] : undefined,
        };

        messages.push(message);
    }

    return messages;
}
