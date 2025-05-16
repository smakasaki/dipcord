import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "#/features/auth";
import { httpClient } from "#/shared/api/http-client";
import { setupHttpInterceptor, teardownHttpInterceptor } from "#/shared/api/http-interceptor";
import { socketService } from "#/shared/api/socket";
import { SocketDebug } from "#/shared/ui/debug-socket";
import { useEffect } from "react";

const isDevelopment = import.meta.env.DEV;

export function AppProviders({ children }: { children: React.ReactNode }) {
    const clearUser = useAuthStore(state => state.clearUser);
    const navigate = useNavigate();

    useEffect(() => {
        const handleUnauthorized = () => {
            // Check the current authentication state with the API
            httpClient.checkAuth().then((isAuthenticated) => {
                if (!isAuthenticated) {
                    clearUser();
                    navigate({ to: "/" });
                }
            });
        };

        // Handle session errors from WebSocket
        socketService.setSessionErrorCallback(handleUnauthorized);

        // Handle unauthorized responses from HTTP requests
        httpClient.setUnauthorizedHandler(handleUnauthorized);

        // Set up global HTTP interceptor for all fetch requests
        setupHttpInterceptor(handleUnauthorized);

        // Clean up on unmount
        return () => {
            teardownHttpInterceptor();
        };
    }, [clearUser, navigate]);

    return (
        <>
            {children}
            {isDevelopment && <SocketDebug />}
        </>
    );
}
