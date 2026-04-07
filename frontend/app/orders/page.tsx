"use client"

import { useEffect, useState } from "react"
import { getOrders, Order } from "@/lib/orders"
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  ExternalLink,
  ShoppingBag
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrders, setExpandedOrders] = useState<string[]>([])

  useEffect(() => {
    setOrders(getOrders())
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 scale-105">Processing</Badge>
      case "Shipped":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-3 py-1 scale-105">Shipped</Badge>
      case "Delivered":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1 scale-105">Delivered</Badge>
      default:
        return <Badge variant="outline" className="px-3 py-1 scale-105">{status}</Badge>
    }
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50/50">
        <div className="p-12 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in duration-500">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-300" />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 mb-2">No orders yet</h1>
           <p className="text-slate-500 mb-8">You haven't placed any orders. Start exploring our unique handcrafted gallery today.</p>
           <Link href="/marketplace">
             <Button className="h-12 px-8 font-bold bg-primary hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10">
               Go to Marketplace
             </Button>
           </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
           <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-2 transition-colors">
             <ArrowLeft className="w-4 h-4 mr-1" />
             Continue Shopping
           </Link>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <ShoppingBag className="w-10 h-10 text-primary" />
             My Orders
           </h1>
           <p className="text-slate-500 mt-2 font-medium">Track your authentic artisanal collection history.</p>
        </div>

        <div className="space-y-6">
          {orders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id)
            return (
              <Card key={order.id} className="overflow-hidden border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <div 
                  className="p-6 sm:p-8 cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded">Order ID</span>
                         <h2 className="text-lg font-mono font-bold text-slate-800">{order.id}</h2>
                       </div>
                       
                       <div className="flex items-center gap-6 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 opacity-70" />
                            {new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <CreditCard className="w-4 h-4 opacity-70" />
                            ${order.total.toFixed(2)}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                       {getStatusBadge(order.status)}
                       <div className="p-1 px-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-primary transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                       </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50/30 p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Order Details</h3>
                    <div className="space-y-4">
                       {order.items.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition hover:shadow-md">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-50">
                               <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                                  <p className="text-sm font-black text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                               </div>
                               <div className="flex justify-between mt-1 items-center">
                                  <p className="text-xs text-slate-400 font-medium tracking-wide">
                                     Price: <span className="text-slate-600">${item.price.toFixed(2)}</span>
                                  </p>
                                  <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">QTY: {item.quantity}</Badge>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                    
                    <div className="pt-4 border-t border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <p className="text-xs text-slate-400 max-w-xs leading-relaxed italic">
                         Your transaction is securely recorded in our historical database. You can track shipping updates directly via the artisan studio dashboard.
                       </p>
                       <Link href={`/product/${order.items[0]?.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 font-bold gap-2">
                            View Original Craft <ExternalLink className="w-4 h-4" />
                          </Button>
                       </Link>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
