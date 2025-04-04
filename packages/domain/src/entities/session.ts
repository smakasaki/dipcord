export interface Session {
    id: string;
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date;
}