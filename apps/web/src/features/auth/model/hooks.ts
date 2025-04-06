import type { LoginRequest, RegisterUserData } from "#/shared/api/auth";

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { useIsAuthenticated, useIsLoading } from "./selectors";
import { useAuthStore } from "./store";

export const useLoginMutation = () => {
    const login = useAuthStore(state => state.login);
    const setError = useAuthStore(state => state.setError);
    const isLoading = useIsLoading();

    const loginMutation = useCallback(
        async (credentials: LoginRequest) => {
            try {
                await login(credentials);
                return true;
            }
            catch (error) {
                if (error && typeof error === "object" && "statusCode" in error) {
                    const apiError = error as { statusCode: number; message: string };
                    setError(apiError.message || "Ошибка авторизации");
                }
                else {
                    setError("Не удалось войти в систему");
                }
                return false;
            }
        },
        [login, setError],
    );

    return { loginMutation, isLoading };
};

export const useRegisterMutation = () => {
    const register = useAuthStore(state => state.register);
    const setError = useAuthStore(state => state.setError);
    const isLoading = useIsLoading();

    const registerMutation = useCallback(
        async (userData: RegisterUserData) => {
            try {
                await register(userData);
                return true;
            }
            catch (error) {
                if (error && typeof error === "object" && "statusCode" in error) {
                    const apiError = error as { statusCode: number; message: string };
                    setError(apiError.message || "Ошибка регистрации");
                }
                else {
                    setError("Не удалось создать аккаунт");
                }
                return false;
            }
        },
        [register, setError],
    );

    return { registerMutation, isLoading };
};

export const useLogoutMutation = () => {
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    const logoutMutation = useCallback(async () => {
        await logout();
        navigate({ to: "/login" });
    }, [logout, navigate]);

    return { logoutMutation };
};

export const useAuthCheck = () => {
    const checkAuth = useAuthStore(state => state.checkAuth);
    const isAuthenticated = useIsAuthenticated();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return { isAuthenticated };
};
