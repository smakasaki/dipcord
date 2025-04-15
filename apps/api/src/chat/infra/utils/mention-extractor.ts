import type { MentionExtractor } from "../../app/ports/outgoing.js";

/**
 * Utility to extract user mentions from message content
 */
export class UserMentionExtractor implements MentionExtractor {
    /**
     * Extract user IDs from message content with @mentions
     * Looks for patterns like @userId or <@userId>
     *
     * @param content Message content
     * @returns Array of mentioned user IDs
     */
    extractMentions(content: string): string[] {
        if (!content) {
            return [];
        }

        // Match both formats: <@userId> and @userId
        const mentionRegex = /<@([0-9a-f-]+)>|@([0-9a-f-]+)/g;
        const mentions: string[] = [];

        // Use let match with null initial value and do-while loop to avoid assignment in condition
        let match: RegExpExecArray | null = null;
        do {
            match = mentionRegex.exec(content);
            if (match !== null) {
                // First capture group is for <@userId> format, second is for @userId format
                const userId = match[1] || match[2];
                if (userId && !mentions.includes(userId)) {
                    mentions.push(userId);
                }
            }
        } while (match !== null);

        return mentions;
    }
}
