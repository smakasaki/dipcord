const originalFetch = window.fetch;

export type UnauthorizedCallback = () => void;

let unauthorizedCallback: UnauthorizedCallback | null = null;

export function setupHttpInterceptor(callback: UnauthorizedCallback) {
    unauthorizedCallback = callback;
}

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
        const response = await originalFetch(input, init);

        if (response.status === 401) {
            // Execute the unauthorized callback if set
            if (unauthorizedCallback) {
                unauthorizedCallback();
            }
        }

        return response;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};

export function teardownHttpInterceptor() {
    window.fetch = originalFetch;
}
