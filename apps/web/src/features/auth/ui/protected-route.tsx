import type { ReactNode } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuthCheck, useIsAuthenticated, useIsLoading } from "../model";

type ProtectedRouteProps = {
    children: ReactNode;
    redirectTo?: string;
};

export function ProtectedRoute({
    children,
    redirectTo = "/login",
}: ProtectedRouteProps) {
    const { isAuthenticated } = useAuthCheck();
    const isLoading = useIsLoading();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate({ to: redirectTo });
        }
    }, [isAuthenticated, isLoading, navigate, redirectTo]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <>{children}</> : null;
}
