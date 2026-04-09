const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

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

export const getCategories = async () => {
    try {
        const response = await fetchApi<any[]>('/categories');
        return response;
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
    }
};

export const getCatalogProducts = async (craftType?: string) => {
    try {
        const query = craftType ? `?craft_type=${encodeURIComponent(craftType)}` : '';
        const response = await fetchApi<any[]>(`/catalog${query}`);
        return response;
    } catch (error) {
        console.error('Failed to fetch catalog products:', error);
        return [];
    }
};

export const getProductReviews = async (productId: string) => {
    try {
        return await fetchApi<any[]>(`/reviews/${productId}`);
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        return [];
    }
};

export const addProductReview = async (
    productId: string,
    review: { name: string; rating: number; comment: string }
) => {
    try {
        return await fetchApi<any>(`/reviews/${productId}`, { method: 'POST', data: review });
    } catch (error) {
        console.error('Failed to post review:', error);
        throw error;
    }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
}

export interface Order {
    orderId: string
    userId: string
    items: OrderItem[]
    total: number
    status: string
    createdAt: string
}

export const createOrder = async (items: OrderItem[], total: number): Promise<Order> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to place an order')
    return fetchApi<Order>('/orders/', {
        method: 'POST',
        data: { items, total },
        token,
    })
}

export const getOrders = async (): Promise<Order[]> => {
    const token = getAuthToken()
    if (!token) return []
    try {
        return await fetchApi<Order[]>('/orders/', { token })
    } catch {
        return []
    }
}

// ─── Listings (Sell) ──────────────────────────────────────────────────────────

export interface CreateListingPayload {
    title: string
    price: number
    description: string
    craftType: string
    region: string
    materials: string
    images: string[]
    storyVideo: string
}

export const createListing = async (payload: CreateListingPayload) => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to list a product')
    return fetchApi<any>('/catalog', { method: 'POST', data: payload, token })
}

export const getMyListings = async (): Promise<any[]> => {
    const token = getAuthToken()
    if (!token) return []
    try {
        // Decode UID from JWT (payload is base64 middle section)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const uid = payload.sub
        return await fetchApi<any[]>(`/catalog?seller_id=${uid}&active_only=false`)
    } catch {
        return []
    }
}

// ─── Payments (Razorpay) ──────────────────────────────────────────────────────

export interface CreatePaymentOrderResponse {
    razorpay_order_id: string
    amount: number
    currency: string
    key_id: string
}

export const createPaymentOrder = async (amount: number, items: OrderItem[]): Promise<CreatePaymentOrderResponse> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to checkout')
    return fetchApi<CreatePaymentOrderResponse>('/payments/create-order', {
        method: 'POST',
        data: { amount, currency: 'INR', items },
        token,
    })
}

export const verifyPayment = async (params: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    items: OrderItem[]
    total: number
}): Promise<{ success: boolean; orderId: string }> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi('/payments/verify', {
        method: 'POST',
        data: params,
        token,
    })
}
