'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string | number
  name: string
  price: number
  image: string
  quantity: number
}

type AddableProduct = Omit<CartItem, 'quantity'>

interface CartContextValue {
  cartItems: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (product: AddableProduct) => void
  removeFromCart: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CART_KEY = 'cart'

function readFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

function writeToStorage(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  // Dispatch so legacy event-based listeners (navbar, etc.) stay in sync
  window.dispatchEvent(new Event('cartUpdated'))
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    setCartItems(readFromStorage())

    // Keep in sync if another tab mutates localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCartItems(readFromStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Persist every time cartItems changes ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      writeToStorage(cartItems)
    }
  }, [cartItems])

  // ── addToCart ──
  const addToCart = useCallback((product: AddableProduct) => {
    // TODO: Replace with backend API
    // await fetch('/api/cart', { method: 'POST', body: JSON.stringify(product) })

    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id))
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  // ── removeFromCart ──
  const removeFromCart = useCallback((id: string | number) => {
    // TODO: Replace with backend API
    // await fetch(`/api/cart/${id}`, { method: 'DELETE' })

    setCartItems((prev) => prev.filter((item) => String(item.id) !== String(id)))
  }, [])

  // ── updateQuantity ──
  const updateQuantity = useCallback((id: string | number, quantity: number) => {
    // TODO: Replace with backend API
    // await fetch(`/api/cart/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) })

    const safeQty = Math.max(1, quantity)
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, quantity: safeQty } : item
      )
    )
  }, [])

  // ── clearCart ──
  const clearCart = useCallback(() => {
    // TODO: Replace with backend API
    // await fetch('/api/cart', { method: 'DELETE' })

    setCartItems([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_KEY)
      window.dispatchEvent(new Event('cartUpdated'))
    }
  }, [])

  // ── Derived values ──
  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  )

  const totalPrice = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  )

  const value: CartContextValue = {
    cartItems,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a <CartProvider>')
  }
  return ctx
}
