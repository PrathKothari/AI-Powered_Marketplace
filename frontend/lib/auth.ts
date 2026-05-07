const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"

export interface AuthUser {
  uid: string
  email: string
  name: string
  role: string
}

// Legacy type kept for backward compat
export interface User {
  name: string;
  email: string;
  role: 'buyer' | 'artisan' | 'both';
  favorites?: string[];
  name: string
  email: string
  role: string
}

interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Request failed")
  return data as T
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return post("/auth/login", { email, password })
}

export async function registerApi(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return post("/auth/signup", { name, email, password })
}

export async function googleLoginApi(credential: string): Promise<AuthResponse> {
  return post("/auth/google", { credential })
}

export async function forgotPasswordApi(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || "Failed to send reset email")
  }
}

export async function resetPasswordApi(oobCode: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oob_code: oobCode, new_password: newPassword }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || "Failed to reset password")
  }
}

export async function logoutApi(): Promise<void> {
  const token = getToken()
  if (!token) {
    console.warn("[Auth] logoutApi: No token found, skipping API call")
    return
  }
  console.log("[Auth] logoutApi: Calling POST /auth/logout...")
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`[Auth] logoutApi: Response status ${res.status}`)
  } catch (err) {
    console.error("[Auth] logoutApi: Network error", err)
  }
}

// ─── Session storage ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function storeSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_token", token)
  localStorage.setItem("auth_user", JSON.stringify(user))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("auth_user")
  localStorage.removeItem("user")
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Failed to parse user from localStorage', error)
    const raw = localStorage.getItem("auth_user")
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

// Legacy helper used by older pages
export function getUser(): User | null {
  return getStoredUser()
}
