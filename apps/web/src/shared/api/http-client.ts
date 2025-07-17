import { useAuthStore } from "#/features/auth";

const API_URL = "/api";

class HttpClient {
    private baseUrl: string;
    private unauthorizedHandler: (() => void) | null = null;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
    }

    setUnauthorizedHandler(handler: () => void) {
        this.unauthorizedHandler = handler;
    }

    private createUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint}`;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (response.status === 401) {
            this.unauthorizedHandler?.();
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return {} as T;
        }

        return response.json();
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(this.createUrl(endpoint), window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        const response = await fetch(this.createUrl(endpoint), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        const response = await fetch(this.createUrl(endpoint), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(this.createUrl(endpoint), {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        return this.handleResponse<T>(response);
    }

    async checkAuth(): Promise<boolean> {
        try {
            await this.get("/v1/users/me");
            return true;
        }
        catch {
            return false;
        }
    }
}

export const httpClient = new HttpClient();
