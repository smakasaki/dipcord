export interface PasswordResetToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
}