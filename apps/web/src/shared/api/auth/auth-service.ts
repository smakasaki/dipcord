import type { User } from "#/entities/user";

import type { LoginRequest, RegisterUserData, UserData } from "./types";

import { httpClient } from "../http-client";

const mapUserResponse = (userData: UserData | null): User | null => {
    if (!userData)
        return null;

    return {
        ...userData,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
    };
};

export const authService = {
    login: async (credentials: LoginRequest) => {
        const data = await httpClient.post<UserData>("/v1/auth/login", credentials);
        return mapUserResponse(data);
    },

    register: async (userData: RegisterUserData) => {
        const data = await httpClient.post<UserData>("/v1/auth/register", userData);
        return mapUserResponse(data);
    },

    logout: async () => {
        await httpClient.post("/v1/auth/logout");
        return true;
    },

    getProfile: async (): Promise<User | null> => {
        try {
            const data = await httpClient.get<UserData>("/v1/auth/profile");
            return mapUserResponse(data);
        }
        catch {
            return null;
        }
    },
};
