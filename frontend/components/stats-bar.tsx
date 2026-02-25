"use client"

import { TrendingUp, Package, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsBarProps {
  totalProducts: number
  activeListings: number
  soldThisMonth: number
}

export default function StatsBar({ totalProducts, activeListings, soldThisMonth }: StatsBarProps) {
  const stats = [
    {
      icon: Package,
      label: "Total Products",
      value: totalProducts,
      color: "text-primary",
    },
    {
      icon: Zap,
      label: "Active Listings",
      value: activeListings,
      color: "text-orange-600",
    },
    {
      icon: TrendingUp,
      label: "Sold This Month",
      value: soldThisMonth,
      color: "text-accent",
    },
  ]

  return (
    <div className="bg-muted/30 border-b border-accent/10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="border-accent/20 bg-card">
                <div className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-primary/5`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
