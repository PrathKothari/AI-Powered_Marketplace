export interface User {
  name: string;
  email: string;
  role: 'buyer' | 'artisan';
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null; // Prevent SSR crashes
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
}
