'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, TrendingUp } from 'lucide-react'

const suggestions = [
  {
    id: 1,
    title: 'Add 2 more photos to improve visibility',
    description: 'Products with more photos get 30% more views on average.',
    icon: '📸',
    fixPage: 'products',
  },
  {
    id: 2,
    title: 'Write a 100-word story to boost trust',
    description: 'Your artisan story helps customers connect with your brand.',
    icon: '📖',
    fixPage: 'story',
  },
  {
    id: 3,
    title: 'Add delivery timeline to reduce drop-offs',
    description: 'Clear shipping info increases confidence in checkout.',
    icon: '🚚',
    fixPage: 'profile',
  },
]

export default function GrowthTools() {
  const [profileStrength] = useState(72)

  const handleFixNow = (page: string) => {
    console.log(`Navigating to ${page} page`)
    // In a real app, this would navigate to the relevant page
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold text-foreground">Growth Tools</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-4">Profile Strength</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
              <span className="text-2xl font-bold text-primary">{profileStrength}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            You're doing great! Keep improving to reach 100% and unlock exclusive features.
          </p>
        </Card>

        <Card className="lg:col-span-2 p-6 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Suggestions to Grow</h3>
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg bg-muted/40 border border-muted flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    {suggestion.title}
                  </h4>
                  <p className="text-muted-foreground text-xs">{suggestion.description}</p>
                </div>
                <Button
                  onClick={() => handleFixNow(suggestion.fixPage)}
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 flex-shrink-0"
                >
                  Fix Now
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
