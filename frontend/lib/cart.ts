export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]")
  } catch (e) {
    return []
  }
}

export function addToCart(product: Omit<CartItem, 'quantity'>) {
  const cart = getCart()
  const existing = cart.find(p => p.id === product.id)

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ ...product, quantity: 1 })
  }

  localStorage.setItem("cart", JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export function removeFromCart(id: string | number) {
  const cart = getCart()
  const filtered = cart.filter(p => p.id !== id)
  localStorage.setItem("cart", JSON.stringify(filtered))
  window.dispatchEvent(new Event('cartUpdated'))
}

export function clearCart() {
  localStorage.removeItem("cart")
  window.dispatchEvent(new Event('cartUpdated'))
}