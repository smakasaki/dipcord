import type { UserState } from "#/entities/user";

import { useAuthStore } from "./store";

export const selectUser = (state: UserState) => state.user;
export const selectIsAuthenticated = (state: UserState) => state.isAuthenticated;
export const selectIsLoading = (state: UserState) => state.isLoading;
export const selectError = (state: UserState) => state.error;

export const useUser = () => useAuthStore(selectUser);
export const useIsAuthenticated = () => useAuthStore(selectIsAuthenticated);
export const useIsLoading = () => useAuthStore(selectIsLoading);
export const useAuthError = () => useAuthStore(selectError);
