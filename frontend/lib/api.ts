const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
    data?: any;
    token?: string;
}

/**
 * Core API fetching utility for communicating with FastAPI backend.
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { data, token, headers: customHeaders, ...customConfig } = options;

    const config: RequestInit = {
        method: data ? "POST" : "GET",
        ...customConfig,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...customHeaders,
        },
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // Handle path with or without leading slash
    const urlPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    try {
        const response = await fetch(`${API_BASE_URL}${urlPath}`, config);
        const result = await response.json();

        if (!response.ok) {
            // Throw the detailed error message from FastAPI if it exists
            const errorMessage = result?.detail || "An error occurred with the API request.";
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
}

/**
 * JWT Token Management helpers
 */
export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
    }
};

export const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("auth_token");
    }
    return null;
};

export const removeAuthToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
    }
};
