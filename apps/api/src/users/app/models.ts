export type CreateUser = {
    name: string;
    surname: string;
    email: string;
    password: string;
};

export type Login = {
    email: string;
    password: string;
};

export type AuthToken = {
    accessToken: string;
};

export type UserRole = "user" | "admin";

export type User = {
    id: string; // UUID string
    name: string;
    surname: string;
    email: string;
    roles: UserRole[];
    createdAt: Date;
    updatedAt: Date;
};

export type PasswordHashWithSalt = {
    hash: string;
    salt: string;
};

export type Session = {
    id: string;
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date;
};

export type CreateSessionData = {
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
};

export type PasswordResetToken = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
};

export type CreatePasswordResetTokenData = {
    userId: string;
    token: string;
    expiresAt: Date;
};
