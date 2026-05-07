'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getOrders, getSellerOrders, getMyListings, updateOrderStatus, getUserProfile, Order } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Package, Star, TrendingUp, CreditCard, ShoppingBag, BarChart3, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import { getOrders, Order } from '@/lib/orders'
import { getProducts } from '@/lib/products'
import { getCart, CartItem } from '@/lib/cart'
import { Product } from '@/lib/types/product'
import { StatCard } from '@/components/dashboard/stat-card'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { GoalProgress } from '@/components/dashboard/goal-progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type ProductWithStats = Product & {
  sales?: number
  rating?: number
}

type DashboardView = 'buyer' | 'seller'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<DashboardView>('buyer')

  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    setOrders(getOrders())
    setProducts(getProducts())
    setCart(getCart())

    if (currentUser.role === 'artisan') {
      setActiveSection('seller')
    }

    if (currentUser.role === 'buyer') {
      setActiveSection('buyer')
    }

    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
    router.push('/login')
  }
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Package, Star, TrendingUp, CreditCard, ShoppingBag,
  BarChart3, ChevronRight, Plus, Paintbrush, Truck, IndianRupee, Radio,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [sellerOrders, setSellerOrders] = useState<Order[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

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

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-6">
             <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
            <aside className="space-y-6">
              {/* Profile Summary Skeleton */}
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 space-y-6">
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
                    <div className="space-y-2 w-full">
                       <Skeleton className="h-4 w-1/3" />
                       <Skeleton className="h-6 w-3/4" />
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                 </div>
              </div>

              {/* Sidebar Nav Skeleton */}
              <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200 space-y-4">
                 <div className="space-y-2 p-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                 </div>
                 <div className="p-4 bg-slate-50/50 rounded-2xl space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                 </div>
              </div>
            </aside>

            <section className="space-y-6">
              <Skeleton className="h-32 w-full rounded-[2.5rem]" />
              
              <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-32 w-full rounded-3xl" />
              </div>

              <Skeleton className="h-96 w-full rounded-3xl" />
              
              <div className="rounded-3xl border border-slate-200 bg-white shadow-md p-8">
                 <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-3 pt-4">
                       {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    )
  }

  const wishlistCount = user.favorites?.length ?? 0
  const totalSpending = orders.reduce((sum, order) => sum + order.total, 0)
  const totalItemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item: any) => itemSum + (item?.quantity || 0), 0),
    0
  )
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const artisanProducts = products as ProductWithStats[]
  const totalSalesCount = artisanProducts.reduce((sum, product) => sum + (product.sales ?? 0), 0)
  const totalRevenue = artisanProducts.reduce((sum, product) => sum + (product.sales ?? 0) * product.price, 0)
  const avgRating = artisanProducts.length > 0
    ? artisanProducts.reduce((sum, product) => sum + (product.rating ?? 0), 0) / artisanProducts.length
  const totalSpending = orders.reduce((sum, o) => sum + o.total, 0)
  const totalItemsPurchased = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)
  const avgRating = listings.length > 0
    ? listings.reduce((sum, p) => sum + (p.rating ?? 0), 0) / listings.length
    : 0
  const totalReviews = listings.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0)
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0)

  const canSwitch = user.role === 'artisan' || user.role === 'both'
  const activeView: DashboardView = canSwitch ? activeSection : 'buyer'

  const ProfileSummary = () => (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-accent p-8 text-white shadow-lg mb-8">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur-md ring-1 ring-white/30">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Welcome back,</p>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">{user.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase backdrop-blur-md">
                {user.role} Account
              </span>
              <span className="text-xs text-white/70 font-medium truncate max-w-[150px]">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {user.role !== 'buyer' && (
            <Button 
              onClick={() => router.push('/sell')} 
              className="bg-white text-primary hover:bg-slate-50 border-none shadow-md font-bold"
            >
              <Plus className="w-4 h-4 mr-2" /> New Listing
            </Button>
          )}
          <Button 
            onClick={() => router.push('/marketplace')} 
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-white border-white/20 backdrop-blur-md font-bold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> Marketplace
          </Button>
        </div>
      </div>
      
      {/* Decorative patterns */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
    </div>
  )

  const renderBuyerDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard 
          title="Total Orders" 
          value={orders.length} 
          icon={Package} 
          trend={{ value: '+12%', positive: true }}
          description="from last month"
          color="blue"
        />
        <StatCard 
          title="Total Spending" 
          value={`$${totalSpending.toFixed(2)}`} 
          icon={CreditCard} 
          trend={{ value: '+5.4%', positive: true }}
          description="average ticket $45"
          color="emerald"
        />
        <StatCard 
          title="Cart Value" 
          value={`$${cartTotal.toFixed(2)}`} 
          icon={ShoppingCart} 
          description={`${cartItemsCount} items waiting`}
          color="amber"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        <OverviewChart 
          title="Spending Trends" 
          subtitle="Monthly overview of your purchases"
          data={[
            { name: 'Jan', value: 450 },
            { name: 'Feb', value: 300 },
            { name: 'Mar', value: 600 },
            { name: 'Apr', value: totalSpending > 600 ? totalSpending : 850 },
          ]}
          color="#10b981"
        />
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-sm text-slate-500">A detailed log of your artisan shopping.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} className="text-primary font-bold hover:bg-primary/5">
            View Statement <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
        <div className="divide-y divide-slate-50">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              onClick={() => router.push('/orders')}
              className="px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-500 font-medium">{new Date(order.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="text-right">
                  <p className="font-bold text-slate-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Completed</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-12">
               <Empty className="py-12 border-none">
                  <EmptyMedia variant="icon" className="bg-slate-50 text-slate-300">
                    <ShoppingBag className="w-8 h-8" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-xl font-bold">No history yet</EmptyTitle>
                    <EmptyDescription className="max-w-xs mx-auto">Your collection starts here. Find your first handcrafted piece in our marketplace.</EmptyDescription>
                  </EmptyHeader>
                  <Button variant="outline" size="sm" onClick={() => router.push('/marketplace')} className="rounded-xl font-bold border-2">
                    Shop Marketplace
                  </Button>
               </Empty>
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
      <div className="max-w-6xl mx-auto space-y-8">

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

        {/* ── BUY SECTION ── */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> My Purchases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-800">{orders.length}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Spent</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalSpending.toFixed(0)}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
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

  const renderArtisanDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Products" 
          value={artisanProducts.length} 
          icon={BarChart3} 
          color="violet"
        />
        <StatCard 
          title="Units Sold" 
          value={totalSalesCount} 
          icon={TrendingUp} 
          trend={{ value: '+14%', positive: true }}
          color="blue"
        />
        <StatCard 
          title="Avg Rating" 
          value={avgRating.toFixed(1)} 
          icon={Star} 
          description="out of 5.0"
          color="amber"
          trend={{ value: 'Top 5%', positive: true }}
        />
        <StatCard 
          title="Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={CreditCard} 
          trend={{ value: '+$1.2k', positive: true }}
          color="emerald"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewChart 
            title="Revenue Analytics" 
            subtitle="Real-time sales performance"
            data={[
              { name: 'Mon', value: 1200 },
              { name: 'Tue', value: 2100 },
              { name: 'Wed', value: 1800 },
              { name: 'Thu', value: 3400 },
              { name: 'Fri', value: 2900 },
              { name: 'Sat', value: 4500 },
              { name: 'Sun', value: totalRevenue > 4000 ? totalRevenue : 5200 },
            ]}
            color="#6366f1"
          />
        </div>
        <div className="lg:col-span-1">
          <GoalProgress 
            title="Revenue Goal"
            current={totalRevenue}
            goal={10000}
            unit="$"
          />
        </div>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inventory Status</h2>
            <p className="text-sm text-slate-500">Live performance of your handcrafted listings.</p>
          </div>
          <Button size="sm" onClick={() => router.push('/sell')} className="shadow-lg font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Listing
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest">Product</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell text-center">Reviews</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Volume</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {artisanProducts.slice(0, 10).map((product) => {
                const sales = product.sales ?? 0
                const rating = product.rating ?? 0
                const maxSales = Math.max(...artisanProducts.map((item) => item.sales ?? 0), 1)
                const progress = Math.round((sales / maxSales) * 100)

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tight">{product.category || 'Handmade'}</p>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> {rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{Math.floor(sales/2)} reviews</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-blue-500/10">{sales} sold</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              progress > 70 ? 'bg-emerald-500' : progress > 40 ? 'bg-blue-500' : 'bg-slate-400'
                            )} 
                            style={{ width: `${progress}%` }} 
                          />
        {/* ── SELL SECTION ── */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" /> My Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Paintings Listed</p>
                <h3 className="text-2xl font-bold text-slate-800">{listings.length}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Star className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Avg Rating</p>
                <h3 className="text-2xl font-bold text-slate-800">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
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
                {listings.map((p) => (
                  <div key={p.productId} className="p-5 flex items-center gap-4 hover:bg-slate-50">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.craftType} · {p.region}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">₹{p.price}</p>
                      <p className="text-xs text-slate-400">{p.reviewCount ?? 0} reviews</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/product/${p.productId}`)}>
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* ── MY SALES SECTION ── */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> My Sales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toFixed(0)}</h3>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex items-center gap-4">
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
                          {order.items.map((item, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.name}</span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-8">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {artisanProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12">
                    <Empty className="py-12 border-none">
                        <EmptyMedia variant="icon" className="bg-slate-50 text-slate-300">
                          <Package className="w-8 h-8" />
                        </EmptyMedia>
                        <EmptyHeader>
                          <EmptyTitle className="text-xl font-bold">No products listed</EmptyTitle>
                          <EmptyDescription className="max-w-xs mx-auto">Ready to share your craft? Add your first listing to start reaching art lovers worldwide.</EmptyDescription>
                        </EmptyHeader>
                        <Button size="sm" onClick={() => router.push('/sell')} className="rounded-xl font-bold shadow-lg">
                          <Plus className="w-4 h-4 mr-2" /> Add First Product
                        </Button>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-6">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-500 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
          <aside className="space-y-6">
            <ProfileSummary />

            <Card className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Workspace</p>
                <h2 className="text-lg font-bold text-slate-900">Platform Control</h2>
              </div>
              <div className="p-2 space-y-1">
                {canSwitch && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveSection('buyer')}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group",
                        activeView === 'buyer' 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className={cn("w-5 h-5", activeView === 'buyer' ? 'text-white' : 'text-slate-400')} />
                        <span className="font-bold text-sm">Buyer View</span>
                      </div>
                      {activeView === 'buyer' && <ChevronRight className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('seller')}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group",
                        activeView === 'seller' 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Package className={cn("w-5 h-5", activeView === 'seller' ? 'text-white' : 'text-slate-400')} />
                        <span className="font-bold text-sm">Seller View</span>
                      </div>
                      {activeView === 'seller' && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </>
                )}
                {!canSwitch && (
                   <div className="px-4 py-3 text-sm font-bold text-primary bg-primary/5 rounded-xl">
                      {user.role === 'buyer' ? 'Personal Account' : 'Artisan Business'}
                   </div>
                )}
              </div>
              
              <div className="p-4 mt-2 space-y-3 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-slate-700 border-slate-200 bg-white hover:bg-primary hover:text-white transition-all group" onClick={() => router.push('/marketplace')}>
                    <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Browse Store
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-slate-700 border-slate-200 bg-white hover:bg-primary hover:text-white transition-all group" onClick={() => router.push('/sell')}>
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> New Product
                  </Button>
                </div>
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden group">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold">Command Center</p>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{activeView === 'buyer' ? 'Buyer Overview' : 'Seller Insights'}</h2>
                </div>
                <div className="rounded-2xl bg-slate-50 px-5 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
                  {activeView === 'buyer' ? 'Shopping & Order Records' : 'Business Revenue Statistics'}
                </div>
              </div>
              {/* Subtle background decoration */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
            </div>

            {activeView === 'buyer' ? renderBuyerDashboard() : renderArtisanDashboard()}
          </section>
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
