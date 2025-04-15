/**
 * Generates a Dicebear avatar URL for a user
 * @param userId - User ID to use as seed
 * @returns URL string for the avatar
 */
export function getUserAvatarUrl(userId: string) {
    return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${userId}`;
}
