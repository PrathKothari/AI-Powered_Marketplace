'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy } from 'lucide-react'

interface GoalProgressProps {
  title: string
  current: number
  goal: number
  unit: string
}

export function GoalProgress({ title, current, goal, unit }: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / goal) * 100), 100)
  
  return (
    <Card className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-900 to-slate-800 p-8 shadow-xl text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Goal</span>
      </div>
      
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-tighter">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black">{current.toLocaleString()}</span>
          <span className="text-slate-400 font-medium">/ {goal.toLocaleString()} {unit}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-slate-400">{percentage}% Reached</span>
          <span className="text-white">{(goal - current).toLocaleString()} {unit} left</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
           <div 
             className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000"
             style={{ width: `${percentage}%` }}
           />
        </div>
      </div>
      
      <p className="mt-6 text-xs text-slate-500 font-medium leading-relaxed italic">
        "Consistency is the key to artisan success. Keep creating!"
      </p>
    </Card>
  )
}
