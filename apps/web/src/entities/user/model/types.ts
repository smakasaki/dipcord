import type { User as DomainUser } from "@dipcord/domain";
import type { UserResponse } from "@dipcord/schema";
import type { Static } from "@sinclair/typebox";

// Re-export the domain User type
export type User = DomainUser;

// Alternative approach using schema
export type UserSchema = Static<typeof UserResponse>;

export type UserState = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
};
