'use client'

import { Globe, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ImpactPage() {
  return (
    <div className="flex-1 flex flex-col gap-8 p-6 md:p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-balance">Your Impact & Reach</h1>
        <p className="text-lg text-muted-foreground">
          See how far your craft is traveling and who it's touching.
        </p>
      </div>

      {/* Section 1: Where your craft has reached */}
      <div className="grid gap-6">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-600" />
              Where your craft has reached
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="text-5xl font-bold text-amber-700 dark:text-amber-400 mb-2">
                7
              </div>
              <p className="text-sm text-muted-foreground">
                cities reached
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-6xl">🌍</div>
            </div>
            <div className="flex-1">
              <p className="text-foreground font-medium">
                Your story is being discovered across regions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: This Week's Growth */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">This Week's Growth</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* New Buyers Card */}
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                New Buyers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-700 dark:text-rose-400">
                12
              </div>
            </CardContent>
          </Card>

          {/* Story Views Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Story Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                148
              </div>
            </CardContent>
          </Card>

          {/* Profile Visits Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Profile Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                36
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Actions to grow */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Actions to grow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex flex-col items-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          >
            <Link href="/artisian/story">
              <Zap className="w-5 h-5" />
              <span>Improve your story</span>
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
          >
            <Link href="/artisian/products">
              <Zap className="w-5 h-5" />
              <span>Add more products</span>
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Link href="/artisian/share">
              <Zap className="w-5 h-5" />
              <span>Share your craft</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
