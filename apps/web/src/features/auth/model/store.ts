import type { UserState } from "#/entities/user";
import type { LoginRequest, RegisterUserData } from "#/shared/api/auth";

import { authService } from "#/shared/api/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
    login: (credentials: LoginRequest) => Promise<void>;
    register: (userData: RegisterUserData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setError: (error: string | null) => void;
} & UserState;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, _get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setError: (error: string | null) => set({ error }),

            login: async (credentials: LoginRequest) => {
                set({ isLoading: true, error: null });

                try {
                    const userData = await authService.login(credentials);

                    set({
                        user: userData,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                }
                catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error instanceof Error
                            ? error.message
                            : "Failed to login. Please check your credentials.",
                    });
                    throw error;
                }
            },

            register: async (userData: RegisterUserData) => {
                set({ isLoading: true, error: null });

                try {
                    const user = await authService.register(userData);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                }
                catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error instanceof Error
                            ? error.message
                            : "Failed to register. Please try again.",
                    });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true, error: null });

                try {
                    await authService.logout();

                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
                catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error
                            ? error.message
                            : "Failed to logout. Please try again.",
                    });
                }
            },

            checkAuth: async () => {
                set({ isLoading: true, error: null });

                try {
                    const user = await authService.getProfile();

                    set({
                        user,
                        isAuthenticated: !!user,
                        isLoading: false,
                    });
                }
                // eslint-disable-next-line unused-imports/no-unused-vars
                catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: state => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
