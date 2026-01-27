'use client'

import { Package, Clock, CheckCircle, IndianRupee } from 'lucide-react'

const stats = [
  {
    title: 'Total Orders',
    value: '24',
    icon: Package,
    gradient: 'from-orange-100 to-amber-100'
  },
  {
    title: 'Pending Orders',
    value: '3',
    icon: Clock,
    gradient: 'from-yellow-100 to-orange-100'
  },
  {
    title: 'Delivered Orders',
    value: '18',
    icon: CheckCircle,
    gradient: 'from-emerald-100 to-teal-100'
  },
  {
    title: 'Earnings This Month',
    value: '₹45,320',
    icon: IndianRupee,
    gradient: 'from-amber-100 to-orange-100'
  }
]

export function StatisticsCards() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className="rounded-xl bg-white/50 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
