'use client'

import { Card } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: string
    positive: boolean
  }
  color?: 'blue' | 'emerald' | 'amber' | 'violet'
}

export function StatCard({ title, value, icon: Icon, description, trend, color = 'blue' }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-500/10',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
    amber: 'bg-amber-50 text-amber-600 ring-amber-500/10',
    violet: 'bg-violet-50 text-violet-600 ring-violet-500/10'
  }

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          
          {(trend || description) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span className={cn(
                  "flex items-center text-xs font-bold",
                  trend.positive ? "text-emerald-600" : "text-rose-600"
                )}>
                  {trend.positive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                  {trend.value}
                </span>
              )}
              {description && <span className="text-xs text-slate-400">{description}</span>}
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-110",
          colorMap[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-slate-50 opacity-50 transition-transform group-hover:scale-150" />
    </Card>
  )
}
