"use client"

import { TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export function OrdersEarningsCard() {
  const router = useRouter()

  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-foreground mb-6">Orders & Earnings</h3>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs text-foreground/60 font-medium mb-2">Today's Orders</p>
          <p className="text-3xl font-bold text-primary">3</p>
        </div>
        <div>
          <p className="text-xs text-foreground/60 font-medium mb-2">Monthly Earnings</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-accent">₹8,450</p>
            <div className="flex items-center gap-1 text-accent text-sm">
              <TrendingUp size={16} />
              <span>+12%</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/artisian/orders")}
        className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
      >
        View All Orders
      </button>
    </div>
  )
}
