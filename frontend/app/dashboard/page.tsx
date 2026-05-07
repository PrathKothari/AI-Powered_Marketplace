'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getOrders, getSellerOrders, getMyListings, updateOrderStatus, getUserProfile, Order,
  generateReel, getReelStatus, ReelJobStatus,
} from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Package, Star, TrendingUp, CreditCard, ShoppingBag,
  BarChart3, ChevronRight, ChevronLeft, Plus, Paintbrush, Truck, IndianRupee, Radio,
  Film, Loader2, Play, RefreshCw,
} from 'lucide-react'

const REEL_STAGE_LABELS: Record<string, string> = {
  pending: 'Queued...',
  scripting: 'Writing script...',
  voiceover: 'Generating voiceover...',
  video: 'Generating video clips...',
  stitching: 'Stitching video...',
  uploading: 'Uploading...',
  complete: 'Ready',
  failed: 'Failed',
}

const ACTIVE_STATUSES = new Set(['pending', 'scripting', 'voiceover', 'video', 'stitching', 'uploading'])

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [sellerOrders, setSellerOrders] = useState<Order[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [reelJobs, setReelJobs] = useState<Record<string, ReelJobStatus>>({})
  const [reelLoading, setReelLoading] = useState<Record<string, boolean>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then(p => setPhotoUrl(p?.photoUrl || null)).catch(() => {})
    Promise.all([getOrders(), getSellerOrders(), getMyListings()]).then(([o, so, l]) => {
      setOrders(o)
      setSellerOrders(so)
      setListings(l)
      setDataLoading(false)
    })
  }, [user])

  const pollActiveJobs = useCallback(async () => {
    const activeEntries = Object.entries(reelJobs).filter(([, job]) => ACTIVE_STATUSES.has(job.status))
    if (activeEntries.length === 0) return
    await Promise.all(
      activeEntries.map(async ([productId, job]) => {
        try {
          const updated = await getReelStatus(job.jobId)
          setReelJobs(prev => ({ ...prev, [productId]: updated }))
          if (updated.status === 'complete') {
            toast.success('Your reel is ready! Tap "Preview Reel" to watch it.')
          } else if (updated.status === 'failed') {
            toast.error(`Reel generation failed: ${updated.error || 'Unknown error'}`)
          }
        } catch {
          // ignore transient poll errors
        }
      })
    )
  }, [reelJobs])

  useEffect(() => {
    const hasActive = Object.values(reelJobs).some(j => ACTIVE_STATUSES.has(j.status))
    if (hasActive) {
      if (!pollRef.current) {
        pollRef.current = setInterval(pollActiveJobs, 5000)
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [reelJobs, pollActiveJobs])

  const handleGenerateReel = async (product: any) => {
    const productId = product.productId
    setReelLoading(prev => ({ ...prev, [productId]: true }))
    try {
      const job = await generateReel({
        productId,
        imageUrls: product.images || [],
        description: product.description || product.title || '',
        productName: product.title,
        tone: 'premium',
        audience: 'art collectors',
        stylePreset: 'artisan_story',
      })
      setReelJobs(prev => ({ ...prev, [productId]: job }))
      if (ACTIVE_STATUSES.has(job.status)) {
        toast.info('Reel generation started! We\'ll notify you when it\'s ready.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start reel generation')
    } finally {
      setReelLoading(prev => ({ ...prev, [productId]: false }))
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </main>
    )
  }

  const totalSpending = orders.reduce((sum, o) => sum + o.total, 0)
  const totalItemsPurchased = orders.reduce((sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0)
  const avgRating = listings.length > 0
    ? listings.reduce((sum, p) => sum + (p.rating ?? 0), 0) / listings.length
    : 0
  const totalReviews = listings.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0)
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processing': return <Badge className="bg-blue-100 text-blue-700 border-none">Processing</Badge>
      case 'Shipped': return <Badge className="bg-amber-100 text-amber-700 border-none">Shipped</Badge>
      case 'Delivered': return <Badge className="bg-emerald-100 text-emerald-700 border-none">Delivered</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleMarkShipped = async (orderId: string) => {
    setUpdatingStatus(orderId)
    try {
      const updated = await updateOrderStatus(orderId, 'Shipped')
      setSellerOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: updated.status } : o))
      toast.success('Order marked as Shipped')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 lg:px-12 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Back Button */}
        <Link 
          href="/marketplace" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-all px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Marketplace</span>
        </Link>

        {/* Profile */}
        <Card className="rounded-xl p-6 shadow-sm bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/5" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-primary/5">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.name}</h1>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => router.push('/live/start')} className="gap-2 bg-red-500 hover:bg-red-600">
              <Radio className="w-4 h-4" /> Go Live
            </Button>
            <Button onClick={() => router.push('/sell')} className="gap-2">
              <Plus className="w-4 h-4" /> List a Painting
            </Button>
            <Button onClick={() => router.push('/marketplace')} variant="outline" className="gap-2">
              <ShoppingBag className="w-4 h-4" /> Marketplace
            </Button>
          </div>
        </Card>

        {/* My Purchases */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> My Purchases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-800">{orders.length}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Spent</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalSpending.toFixed(0)}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Items Bought</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalItemsPurchased}</h3>
              </div>
            </Card>
          </div>

          <Card className="mt-4 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Recent Orders</h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} className="text-primary">View All</Button>
            </div>
            <div className="divide-y divide-slate-50">
              {orders.slice(0, 4).map((order) => (
                <div key={order.orderId} onClick={() => router.push('/orders')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{order.orderId}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-slate-800">₹{order.total.toFixed(0)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic text-sm">
                  No orders yet.{' '}
                  <Link href="/marketplace" className="text-primary hover:underline">Start shopping</Link>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* My Listings */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" /> My Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Paintings Listed</p>
                <h3 className="text-2xl font-bold text-slate-800">{listings.length}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Star className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Avg Rating</p>
                <h3 className="text-2xl font-bold text-slate-800">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart3 className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Reviews</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalReviews}</h3>
              </div>
            </Card>
          </div>

          <Card className="mt-4 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">My Paintings</h3>
              <Button size="sm" onClick={() => router.push('/sell')} className="gap-2">
                <Plus className="w-4 h-4" /> Add New
              </Button>
            </div>
            {dataLoading ? (
              <div className="p-10 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : listings.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic text-sm">
                No listings yet.{' '}
                <Link href="/sell" className="text-primary hover:underline">List your first painting</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {listings.map((p) => {
                  const reelJob = reelJobs[p.productId]
                  const isLoading = reelLoading[p.productId]
                  const isActive = reelJob && ACTIVE_STATUSES.has(reelJob.status)
                  const isComplete = reelJob?.status === 'complete'
                  const isFailed = reelJob?.status === 'failed'

                  return (
                    <div key={p.productId} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.craftType} · {p.region}</p>
                          {isActive && (
                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {REEL_STAGE_LABELS[reelJob.status]}
                            </p>
                          )}
                          {isFailed && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Reel failed: {reelJob.error || 'unknown error'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right mr-2">
                          <p className="font-bold text-primary">₹{p.price}</p>
                          <p className="text-xs text-slate-400">{p.reviewCount ?? 0} reviews</p>
                        </div>

                        {isComplete ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 active:bg-emerald-200 active:text-emerald-800 transition-colors"
                              onClick={() => window.open(reelJob.videoUrl!, '_blank')}
                            >
                              <Play className="w-3.5 h-3.5" /> Preview Reel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-slate-500"
                              onClick={() => handleGenerateReel(p)}
                              disabled={isLoading}
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                            </Button>
                          </>
                        ) : isActive ? (
                          <Button size="sm" variant="ghost" disabled className="gap-1.5 text-slate-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-100 hover:text-violet-700 active:bg-violet-200 active:text-violet-800 transition-colors"
                            onClick={() => handleGenerateReel(p)}
                            disabled={isLoading || !p.images?.length}
                          >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                            {isFailed ? 'Try Again' : 'Generate Reel'}
                          </Button>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => router.push(`/product/${p.productId}`)}>
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </section>

        {/* My Sales */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> My Sales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toFixed(0)}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Orders Received</p>
                <h3 className="text-2xl font-bold text-slate-800">{sellerOrders.length}</h3>
              </div>
            </Card>
          </div>

          <Card className="bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Incoming Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Orders placed by buyers for your paintings</p>
            </div>
            {dataLoading ? (
              <div className="p-10 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sellerOrders.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic text-sm">
                No sales yet. Your orders will appear here once buyers purchase your paintings.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {sellerOrders.map((order) => (
                  <div key={order.orderId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{order.orderId}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.items.map((item: any, i: number) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-slate-800">₹{order.total.toFixed(0)}</span>
                      {getStatusBadge(order.status)}
                      {order.status === 'Processing' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                          disabled={updatingStatus === order.orderId}
                          onClick={() => handleMarkShipped(order.orderId)}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          {updatingStatus === order.orderId ? '...' : 'Mark Shipped'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

      </div>
    </main>
  )
}
