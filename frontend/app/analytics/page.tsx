'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, TrendingUp, ChartLine, Package } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"
import Link from "next/link"

const salesData = [
  { day: "Mon", sales: 48, revenue: 320 },
  { day: "Tue", sales: 72, revenue: 410 },
  { day: "Wed", sales: 64, revenue: 385 },
  { day: "Thu", sales: 88, revenue: 520 },
  { day: "Fri", sales: 102, revenue: 610 },
  { day: "Sat", sales: 95, revenue: 580 },
  { day: "Sun", sales: 120, revenue: 700 },
]

const productInsightData = [
  { name: "Handwoven Basket", sold: 120, returns: 2 },
  { name: "Ceramic Mug Set", sold: 84, returns: 1 },
  { name: "Leather Journal", sold: 95, returns: 0 },
]

export default function AnalyticsPage() {
  return (
    <main className="container mx-auto p-6 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/80 font-semibold">Analytics</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Detailed Sales & Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Review product performance, stock health, and demand trends from the last week in one polished analytics view.</p>
        </div>
        <Button asChild variant="secondary" className="w-full sm:w-auto gap-2">
          <Link href="/artisan/inventory" className="inline-flex items-center gap-2 w-full justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Inventory
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-slate-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Weekly Growth</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Compared to last week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold">+18.6%</p>
            <p className="text-sm text-muted-foreground">Orders and revenue are trending upward across your featured products.</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" /> Stock Health</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Current inventory status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold">78%</p>
            <p className="text-sm text-muted-foreground">Most of your catalog has healthy stock levels, with a few low-stock items needing attention.</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-sky-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ChartLine className="w-4 h-4 text-sky-600" /> Conversion Rate</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Latest performance metric</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold">4.9%</p>
            <p className="text-sm text-muted-foreground">A strong signal that product presentation and demand are aligned.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-5 h-5 text-muted-foreground" /> Sales & Revenue Trends</CardTitle>
            <CardDescription>Daily sales volume and revenue in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-border/60">
                <p className="text-sm text-muted-foreground">Top selling day</p>
                <p className="text-2xl font-semibold">Sunday</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-border/60">
                <p className="text-sm text-muted-foreground">Highest revenue</p>
                <p className="text-2xl font-semibold">$700</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Product Performance</CardTitle>
            <CardDescription>Quick view of units sold and return rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productInsightData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sold" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="returns" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {productInsightData.map((product) => (
                <div key={product.name} className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{product.name}</p>
                    <span className="text-sm text-muted-foreground">Returns: {product.returns}</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{product.sold} sold</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
