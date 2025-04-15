import type { User } from "#/entities/user";

import type { LoginRequest, RegisterUserData, UserData } from "./types";

import { GET, POST } from "../client";

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
        const { data, error } = await POST("/v1/auth/login", {
            body: credentials,
        });

        if (error) {
            throw error;
        }

        return mapUserResponse(data);
    },

    register: async (userData: RegisterUserData) => {
        const { data, error } = await POST("/v1/auth/register", {
            body: userData,
        });

        if (error) {
            throw error;
        }

        return mapUserResponse(data);
    },

    logout: async () => {
        const { error } = await POST("/v1/auth/logout", {});

        if (error) {
            throw error;
        }

        return true;
    },

    getProfile: async (): Promise<User | null> => {
        const { data, error } = await GET("/v1/auth/profile", {});

        if (error) {
            if (error.statusCode === 401) {
                return null;
            }
            throw error;
        }

        return mapUserResponse(data);
    },
};
