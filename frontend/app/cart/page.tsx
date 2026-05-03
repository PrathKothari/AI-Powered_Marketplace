'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCart, clearCart, CartItem } from '@/lib/cart'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])

  const loadCart = () => setCart(getCart())

  useEffect(() => {
    loadCart()
    const handleUpdate = () => loadCart()
    window.addEventListener('cartUpdated', handleUpdate)
    return () => window.removeEventListener('cartUpdated', handleUpdate)
  }, [])

  const updateStorage = (updatedCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
    setCart(updatedCart)
  }

  const handleRemove = (id: string | number) => {
    const updated = cart.filter((item) => item.id !== id)
    updateStorage(updated)
  }

  const handleQuantity = (id: string | number, delta: number) => {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item,
    )
    updateStorage(updated)
  }

  const handleCheckout = () => {
    alert('Checkout flow initiated!')
    clearCart()
    router.push('/dashboard')
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 5.0 : 0
  const total = subtotal + shipping
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 mt-[-64px]">
        <Empty className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
           <EmptyMedia variant="icon" className="bg-primary/5 text-primary ring-4 ring-primary/5">
              <ShoppingBag className="w-10 h-10" />
           </EmptyMedia>
           <EmptyHeader className="space-y-4">
              <EmptyTitle className="text-3xl font-black text-slate-900 tracking-tight">Your cart is empty</EmptyTitle>
              <EmptyDescription className="text-slate-500 text-lg leading-relaxed font-medium">
                Looks like you haven't added any treasures to your collection yet. Start exploring our handmade masterpieces.
              </EmptyDescription>
           </EmptyHeader>
           <Button
             variant="default"
             size="lg"
             className="w-full rounded-2xl h-14 bg-slate-900 hover:bg-primary text-white shadow-xl shadow-slate-900/10 transition-all duration-300 font-bold text-lg group"
             onClick={() => router.push('/marketplace')}
           >
             Start Exploring
             <ShoppingBag className="ml-2 w-5 h-5 transition-transform group-hover:scale-110" />
           </Button>
        </Empty>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm shadow-slate-200">
              <Link href="/marketplace" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-amber-300 hover:text-amber-700">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span>{totalItems} items in cart</span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Your artisan cart</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">A warm, modern shopping experience with clean controls and a clear checkout path.</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto rounded-full px-8 py-3 text-slate-800 shadow-sm shadow-slate-200 hover:bg-slate-100"
            onClick={() => router.push('/marketplace')}
          >
            Continue browsing
          </Button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-5">
            {cart.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden rounded-[1.75rem] border border-amber-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="grid gap-5 p-5 sm:grid-cols-[120px_1fr] sm:p-6">
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-amber-50 border border-amber-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">Handcrafted with care for your marketplace collection.</p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">${item.price.toFixed(2)}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5">Item total: ${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-1.5 py-1 shadow-sm">
                        <button
                          onClick={() => handleQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="mx-3 min-w-[2.2rem] text-center font-semibold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(item.id, 1)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                        ${ (item.price * item.quantity).toFixed(2) }
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <aside className="space-y-5">
            <Card className="rounded-[1.75rem] border border-amber-100 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-amber-500 font-semibold">Summary</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">Secure Checkout</h2>
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700">Fast</div>
              </div>

              <div className="mt-7 space-y-4 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-amber-50 px-5 py-4 text-slate-900 shadow-sm">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">All artisan products are hand-verified and ready to ship.</p>
              </div>

              <Button
                variant="default"
                size="lg"
                className="mt-6 w-full rounded-full bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.01]"
                onClick={handleCheckout}
              >
                Checkout Now
              </Button>
            </Card>

            <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Need help?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Questions about your order, shipping, or handcrafted items? We’re here to help.</p>
              <Button
                variant="secondary"
                size="lg"
                className="mt-5 w-full rounded-full bg-white text-slate-900 shadow-sm hover:bg-slate-100"
                onClick={() => router.push('/help')}
              >
                Contact support
              </Button>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}
