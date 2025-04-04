export interface User {
    id: string;
    name: string;
    surname: string;
    email: string;
    username: string;
    roles: UserRole[];
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = "user" | "admin";