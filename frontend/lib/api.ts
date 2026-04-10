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

export const createCategory = async (name: string, description: string = '') => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to create a category')
    return fetchApi<any>('/categories', {
        method: 'POST',
        data: { name, description },
        token,
    })
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

export const getSellerOrders = async (): Promise<Order[]> => {
    const token = getAuthToken()
    if (!token) return []
    try {
        return await fetchApi<Order[]>('/orders/seller', { token })
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
    storyVideo?: string
}

export const createListing = async (payload: CreateListingPayload) => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to list a product')
    return fetchApi<any>('/catalog', { method: 'POST', data: payload, token })
}

export const updateListing = async (productId: string, payload: Partial<CreateListingPayload>): Promise<any> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi<any>(`/catalog/${productId}`, { method: 'PUT', data: payload, token })
}

export const deleteListing = async (productId: string): Promise<void> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    await fetchApi<void>(`/catalog/${productId}`, { method: 'DELETE', token })
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

// ─── Order Status ─────────────────────────────────────────────────────────────

export const updateOrderStatus = async (orderId: string, status: string): Promise<Order> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi<Order>(`/orders/${orderId}/status`, { method: 'PATCH', data: { status }, token })
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfile = async (name: string): Promise<{ access_token: string; user: any }> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi('/auth/profile', { method: 'PATCH', data: { name }, token })
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

// ─── User Profile (Bio) ─────────────────────────────────────────────────────

export interface UserProfile {
    uid: string
    name: string
    bio?: string | null
    craftType?: string | null
    region?: string | null
    experienceYears?: number | null
    languages?: string[] | null
    photoUrl?: string | null
}

export interface UpdateProfilePayload {
    bio?: string
    craftType?: string
    region?: string
    experienceYears?: number
    languages?: string[]
    photoUrl?: string
}

export const updateUserProfile = async (payload: UpdateProfilePayload): Promise<any> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi('/users/profile', { method: 'PATCH', data: payload, token })
}

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    return fetchApi<UserProfile>(`/users/profile/${userId}`)
}

// ─── Live Streaming ──────────────────────────────────────────────────────────

export interface LiveSession {
    sessionId: string
    userId: string
    userName: string
    title: string
    description: string
    productId: string
    status: 'live' | 'ended'
    viewerCount: number
    hlsUrl?: string | null
    recordingUrl?: string | null
    thumbnailUrl?: string | null
    startedAt: string
    endedAt?: string | null
    recentMessages?: ChatMessage[]
}

export interface ChatMessage {
    messageId: string
    sessionId: string
    userId: string
    userName: string
    message: string
    timestamp: string
}

export interface CreateSessionPayload {
    title: string
    description: string
    productId: string
}

export const createLiveSession = async (payload: CreateSessionPayload): Promise<LiveSession> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in to go live')
    return fetchApi<LiveSession>('/live/sessions', { method: 'POST', data: payload, token })
}

export const getLiveSessions = async (): Promise<LiveSession[]> => {
    try {
        return await fetchApi<LiveSession[]>('/live/sessions')
    } catch {
        return []
    }
}

export const getLiveSession = async (sessionId: string): Promise<LiveSession> => {
    return fetchApi<LiveSession>(`/live/sessions/${sessionId}`)
}

export const endLiveSession = async (sessionId: string): Promise<LiveSession> => {
    const token = getAuthToken()
    if (!token) throw new Error('You must be logged in')
    return fetchApi<LiveSession>(`/live/sessions/${sessionId}/end`, { method: 'PATCH', token })
}
