'use client'

import React from "react"

import { Card } from '@/components/ui/card'
import { Package, ShoppingBag, IndianRupee, Star } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all p-5 text-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </Card>
  )
}

export default function PerformanceSnapshot() {
  return (
    <Card className="border-0 shadow-sm p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Performance Snapshot</h2>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Package size={28} style={{ color: 'var(--primary)' }} />}
          label="Total Products"
          value="48"
          subtext="Active listings"
        />
        <StatCard
          icon={<ShoppingBag size={28} style={{ color: 'var(--primary)' }} />}
          label="Total Orders"
          value="342"
          subtext="All time"
        />
        <StatCard
          icon={<IndianRupee size={28} style={{ color: 'var(--primary)' }} />}
          label="Total Earnings"
          value="₹1,24,560"
          subtext="This year"
        />
        <StatCard
          icon={<Star size={28} style={{ color: 'var(--primary)' }} />}
          label="Avg Rating"
          value="4.6"
          subtext="From reviews"
        />
      </div>
    </Card>
  )
}
