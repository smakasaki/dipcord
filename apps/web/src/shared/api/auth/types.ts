import type { UserResponse } from "@dipcord/schema";
import type { LoginRequest as SchemaLoginRequest } from "@dipcord/schema/auth";
import type { Static } from "@sinclair/typebox";

export type RegisterUserData = {
    name: string;
    surname: string;
    username: string;
    email: string;
    password: string;
};

export type LoginRequest = Static<typeof SchemaLoginRequest>;
export type UserData = Static<typeof UserResponse>;

export type AuthError = {
    status: number;
    statusText: string;
    message: string;
};
