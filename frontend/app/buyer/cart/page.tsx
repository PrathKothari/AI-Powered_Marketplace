"use client"

import { useCart } from "@/context/CartContext"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Loader2, Sparkles, ShieldCheck, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { createPaymentOrder, verifyPayment } from "@/lib/api"

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BuyerCartPage() {
  const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  if (!isMounted) return null

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    setIsProcessing(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setIsProcessing(false)
        return
      }

      const orderItems = cartItems.map(item => ({
        id: String(item.id),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image ?? '',
      }))

      const paymentOrder = await createPaymentOrder(totalPrice, orderItems)

      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'KalaSetu',
        description: 'Authentic Indian Art & Craft',
        order_id: paymentOrder.razorpay_order_id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: orderItems,
              total: totalPrice,
            })
            if (result.success) {
              clearCart()
              toast.success(`Order ${result.orderId} placed successfully!`)
              router.push('/orders')
            }
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed.')
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => { setIsProcessing(false) },
        },
        prefill: {},
        theme: { color: '#7c3aed' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`)
        setIsProcessing(false)
      })
      rzp.open()
    } catch (error: any) {
      toast.error(error.message || 'Checkout failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const onUpdateQty = (id: string | number, newQty: number) => {
    if (newQty < 1) return
    updateQuantity(id, newQty)
    toast.message("Quantity updated", { duration: 1000 })
  }

  const onRemove = (id: string | number, name: string) => {
    removeFromCart(id)
    toast.success(`${name} removed from cart`)
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="w-16 h-16" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Your basket is quiet</h1>
            <p className="text-muted-foreground text-lg">Every great collection starts with a single discovery. Browse our unique handcrafted items to get started.</p>
          </div>
          <Button
            size="lg"
            className="rounded-full px-12 py-7 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all font-bold"
            onClick={() => router.push('/marketplace')}
          >
            Shop Marketplace
          </Button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-12">
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to shopping
            </button>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight flex items-center gap-4">
              Shopping Cart <span className="text-2xl text-muted-foreground font-normal">({totalItems})</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-6">
            {cartItems.map((item, idx) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-border/40 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                  <div className="relative w-full sm:w-40 h-40 rounded-2xl overflow-hidden bg-muted flex items-center justify-center group-hover:shadow-lg transition-all duration-500">
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Certified Authentic Artisan Piece
                          </p>
                        </div>
                        <button
                          onClick={() => onRemove(item.id, item.name)}
                          className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group/trash"
                        >
                          <Trash2 className="w-5 h-5 group-hover/trash:scale-110" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full border border-accent/20">
                          <Truck className="w-3.5 h-3.5 text-accent-foreground/60" />
                          <span className="text-xs font-semibold text-accent-foreground/80 uppercase">Free Express Shipping</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          2-Year Warranty
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 mt-4 border-t border-border/40">
                      <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-xl border border-border/20 w-fit">
                        <button
                          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background hover:text-primary transition-all active:scale-90"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-lg font-bold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background hover:text-primary transition-all active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-2xl font-black text-foreground tracking-tighter">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="p-8 rounded-3xl bg-gradient-to-r from-accent/5 to-primary/5 border border-primary/10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8 text-primary/60" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-lg font-bold text-foreground">Artisan Direct Guarantee</h4>
                <p className="text-muted-foreground leading-relaxed">Your purchase supports small creators directly. Every item is hand-inspected for quality before shipping.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <Card className="p-8 rounded-[2rem] border-border/50 shadow-2xl shadow-primary/5 bg-background/80 backdrop-blur-xl">
              <h2 className="text-2xl font-extrabold text-foreground mb-8 pb-4 border-b border-border/40">Order Summary</h2>

              <div className="space-y-4 text-muted-foreground font-medium mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-foreground">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Express Shipping</span>
                  <span className="text-emerald-500 uppercase text-[10px] font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Free</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Estimated Tax</span>
                  <span className="text-foreground">₹0.00</span>
                </div>
              </div>

              <div className="pt-6 border-t border-border/80 border-dashed">
                <div className="flex justify-between items-end mb-10">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Amount</span>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Incl. all taxes & delivery</p>
                  </div>
                  <span className="text-4xl font-black text-foreground tracking-tighter">₹{totalPrice.toFixed(2)}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-black text-lg tracking-tight shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      Secure Checkout
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="mt-8 pt-4 flex flex-col items-center gap-3">
                <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest">
                  SSL Encrypted • 256-bit Secure Payment
                </p>
              </div>
            </Card>

            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">Need help completing your order?</p>
              <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                Chat with an Expert
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-foreground">₹{totalPrice.toFixed(2)}</span>
          </div>
          <Button
            className="flex-1 h-14 rounded-xl bg-primary font-black text-base shadow-lg shadow-primary/20 active:scale-95 transition-all"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Checkout Now"}
          </Button>
        </div>
      </div>
    </div>
  )
}
