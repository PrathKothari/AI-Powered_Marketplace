"use client"

import { useCart } from "@/context/CartContext"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, ShoppingCart, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { addOrder } from "@/lib/orders"

export default function BuyerCartPage() {
  const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    setIsProcessing(true)

    // Simulate light async delay for realistic feel
    await new Promise(r => setTimeout(r, 1200))

    try {
      const orderData = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        items: [...cartItems],
        total: totalPrice,
        date: new Date().toISOString(),
        status: "Processing" as const
      }

      // 1. Save to orders history
      addOrder(orderData)

      // 2. Clear current cart
      clearCart()

      // 3. Navigate to orders page
      router.push('/orders')
    } catch (error) {
       console.error("Checkout failed:", error)
       alert("Something went wrong during checkout. Please try again.")
    } finally {
       setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50/30">
        <div className="p-12 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
           <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-primary" />
           </div>
           <h1 className="text-3xl font-extrabold text-slate-800 mb-2"> Your cart is empty</h1>
           <p className="text-slate-500 mb-8 max-w-sm">Looks like you haven't added any authentic artisan crafts to your cart yet.</p>
           <Link href="/marketplace">
             <Button className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
               Explore Marketplace
             </Button>
           </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
           <div>
             <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-2 transition-colors">
               <ArrowLeft className="w-4 h-4 mr-1" />
               Back to Marketplace
             </Link>
             <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
             <p className="text-slate-500 mt-1 font-medium italic">You have {totalItems} items in your artisanal collection.</p>
           </div>
           <Button 
             variant="outline" 
             onClick={clearCart}
             className="text-destructive border-destructive/20 hover:bg-destructive/10 h-10 px-6 rounded-xl font-bold"
           >
             Clear Cart
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow group rounded-2xl p-4"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Item Image */}
                  <div className="w-full sm:w-32 h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-[1.02] transition-transform">
                    <img 
                      src={item.image || "/placeholder.png"} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-bold text-slate-800 truncate pr-4">{item.name}</h3>
                       <p className="text-xl font-black text-primary">${item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-4 border-t border-slate-50">
                       <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 text-slate-500 hover:text-primary hover:bg-white rounded-lg transition-all active:scale-90"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-bold text-slate-800 text-lg">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             className="p-2 text-slate-500 hover:text-primary hover:bg-white rounded-lg transition-all active:scale-90"
                          >
                             <Plus className="w-4 h-4" />
                          </button>
                       </div>

                       <div className="flex items-center gap-6">
                          <p className="text-sm font-medium text-slate-400">
                            Subtotal: <span className="text-slate-800 font-bold ml-1">${(item.price * item.quantity).toFixed(2)}</span>
                          </p>
                          <button 
                             onClick={() => removeFromCart(item.id)}
                             className="p-2.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all active:scale-90 border border-transparent hover:border-destructive/20"
                          >
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Checkout Summary Panel */}
          <aside className="lg:col-span-4">
             <Card className="sticky top-24 p-8 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-8">
                   <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-slate-800 font-bold">${totalPrice.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-slate-500 font-medium">
                      <span>Estimated Shipping</span>
                      <span className="text-emerald-500 font-bold">Free</span>
                   </div>
                   <div className="flex justify-between text-slate-500 font-medium pb-4">
                      <span>Taxes & Fees</span>
                      <span className="text-slate-800 font-bold">$0.00</span>
                   </div>
                   <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xl font-extrabold text-slate-800 uppercase tracking-wider">Total</span>
                      <span className="text-3xl font-black text-primary">${totalPrice.toFixed(2)}</span>
                   </div>
                </div>

                <div className="space-y-3">
                   <Button 
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 transition-all rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
                   >
                     {isProcessing ? (
                       <>
                         <Loader2 className="w-6 h-6 animate-spin" />
                         Processing Payment...
                       </>
                     ) : (
                       <>
                         <CreditCard className="w-6 h-6" />
                         Checkout Now
                       </>
                     )}
                   </Button>
                   <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                     By proceeding to checkout you agree to our Terms of Service and Privacy Policy. All products are authentic and hand-verified.
                   </p>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 text-slate-400">
                   <ShoppingCart className="w-4 h-4" />
                   <span className="text-xs font-semibold tracking-widest uppercase">Secure Transaction</span>
                </div>
             </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
