'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCart, removeFromCart, clearCart, CartItem } from '@/lib/cart'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])

  const loadCart = () => setCart(getCart())

  useEffect(() => {
    loadCart()
    window.addEventListener('cartUpdated', loadCart)
    return () => window.removeEventListener('cartUpdated', loadCart)
  }, [])

  const handleRemove = (id: string | number) => {
    removeFromCart(id)
  }

  const handleCheckout = () => {
    alert("Checkout flow initiated!")
    clearCart()
    router.push('/dashboard')
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const shipping = subtotal > 0 ? 5.00 : 0
  const total = subtotal + shipping

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-slate-100 p-6 rounded-full inline-block mb-4">
            <ShoppingBag className="w-12 h-12 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
          <p className="text-slate-500 mb-6 font-medium">Looks like you haven't added anything yet.</p>
          <Button onClick={() => router.push('/marketplace')} className="bg-primary hover:bg-primary/90 text-white font-semibold">
            Explore Marketplace
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[85vh] bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <Link href="/marketplace" className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-500 bg-slate-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </Link>
           <h1 className="text-3xl font-bold text-slate-800">Review Your Cart</h1>
           <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{cart.reduce((a,b) => a + b.quantity, 0)} items</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="p-4 sm:p-6 rounded-xl flex flex-col sm:flex-row gap-6 shadow-sm border-border bg-white transition hover:shadow-md">
                <div className="w-full sm:w-32 h-32 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{item.name}</h3>
                      <p className="text-primary font-bold text-lg mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-border">
                      QTY: {item.quantity}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6 rounded-xl shadow-sm border-border bg-white">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Shipping Estimation</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={handleCheckout} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm h-12 text-md">
                Proceed to Checkout
              </Button>
              <div className="mt-4 text-center">
                 <button onClick={clearCart} className="text-xs text-slate-400 hover:underline hover:text-red-500">
                   Empty entire cart
                 </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
