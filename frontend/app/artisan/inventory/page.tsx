'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getMyListings } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, TrendingUp, Plus, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

export default function InventoryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getMyListings().then(data => {
      setListings(data)
      setDataLoading(false)
    })
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const lowStock = listings.filter(p => (p.stock ?? 0) <= 3)
  const inStock = listings.filter(p => (p.stock ?? 0) > 3)

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your listed paintings</p>
        </div>
        <Button onClick={() => router.push('/sell')} className="gap-2">
          <Plus className="w-4 h-4" /> List New Painting
        </Button>
      </div>

      {/* Alerts */}
      {!dataLoading && lowStock.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-700">{lowStock.length} painting{lowStock.length > 1 ? 's' : ''} with low stock (≤3 units)</span>
          </CardContent>
        </Card>
      )}

      {dataLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">You haven't listed any paintings yet.</p>
          <Button onClick={() => router.push('/sell')}>List Your First Painting</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((item) => {
            const stock = item.stock ?? 0
            const isLow = stock <= 3
            return (
              <Card key={item.productId} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                    <Badge variant={isLow ? 'destructive' : 'secondary'} className={isLow ? '' : 'bg-green-100 text-green-700'}>
                      {isLow ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.craftType} · {item.region}</p>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="text-2xl font-bold font-mono">{stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-lg font-bold text-primary">₹{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {(item.rating ?? 0) > 0 ? item.rating.toFixed(1) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/product/${item.productId}`)}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
