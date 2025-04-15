export type User = {
    id: string;
    name: string;
    surname: string;
    email: string;
    username: string;
    roles: UserRole[];
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type UserRole = "user" | "admin";