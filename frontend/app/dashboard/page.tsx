'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, User } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Package, Star, TrendingUp, CreditCard, ShoppingBag, BarChart3, ChevronRight } from 'lucide-react'

// Mock Data
const mockOrders = [
  { id: 1, name: "Handwoven Basket", price: 45, date: "Oct 24, 2023" },
  { id: 2, name: "Ceramic Mug Set", price: 32, date: "Oct 21, 2023" },
  { id: 3, name: "Leather Journal", price: 55, date: "Oct 15, 2023" }
]

const mockProducts = [
  { id: 1, name: "Handwoven Basket", sales: 48, rating: 4.8 },
  { id: 2, name: "Knitted Wool Scarf", sales: 24, rating: 4.5 },
  { id: 3, name: "Ceramic Vase", sales: 12, rating: 4.2 }
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // --- Profile Card Fragment ---
  const ProfileSummary = () => (
    <Card className="rounded-xl p-6 shadow-sm border-border bg-white mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-primary/5">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.name}</h1>
          <p className="text-slate-500 capitalize font-medium flex items-center gap-2">
            {user.role} Account
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          </p>
        </div>
      </div>
      
      <div className="flex gap-3">
        {user.role === 'artisan' && (
          <Button onClick={() => router.push('/sell')} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
            <Package className="w-4 h-4 mr-2" />
            Sell Product
          </Button>
        )}
        <Button onClick={() => router.push('/marketplace')} variant="outline" className="border-slate-200">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Marketplace
        </Button>
      </div>
    </Card>
  )

  // --- Buyer Dashboard Render ---
  const renderBuyerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-sm border-border bg-white flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-800">12</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-xl shadow-sm border-border bg-white flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Spending</p>
              <h3 className="text-2xl font-bold text-slate-800">$458.00</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border bg-white flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Items Purchased</p>
              <h3 className="text-2xl font-bold text-slate-800">18</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-border bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
        </div>
        <div className="divide-y divide-slate-100">
          {mockOrders.map((order) => (
            <div key={order.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{order.name}</h4>
                  <p className="text-sm text-slate-500">Ordered on {order.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-800">${order.price.toFixed(2)}</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  // --- Artisan Dashboard Render ---
  const renderArtisanDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-xl shadow-sm border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+4%</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Total Products</p>
          <h3 className="text-2xl font-bold text-slate-800">24</h3>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Total Sales</p>
          <h3 className="text-2xl font-bold text-slate-800">142</h3>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Consistent</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Average Rating</p>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1">
            4.8<Star className="w-5 h-5 fill-yellow-400 text-yellow-500 inline -mt-1" />
          </h3>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+18%</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Total Revenue</p>
          <h3 className="text-2xl font-bold text-emerald-600">$4,850</h3>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-border bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Product Performance</h2>
          <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200">Export Report</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 hidden sm:table-row">
                <th className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">Product Name</th>
                <th className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap hidden md:table-cell">Rating</th>
                <th className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">Sale Volume</th>
                <th className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockProducts.map((p) => {
                const maxSales = Math.max(...mockProducts.map(mp => mp.sales))
                const progressWidth = Math.round((p.sales / maxSales) * 100)
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 flex flex-col sm:table-row p-4 sm:p-0">
                    <td className="sm:p-4 py-2">
                       <h4 className="font-semibold text-slate-800">{p.name}</h4>
                       <span className="text-xs text-slate-500 sm:hidden mt-1 flex items-center gap-1">
                          Sales: {p.sales} • <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" /> {p.rating}
                       </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" /> {p.rating}
                      </div>
                    </td>
                    <td className="sm:p-4 py-1 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium text-xs bg-blue-50 text-blue-700 border border-blue-100">
                        {p.sales} sales
                      </span>
                    </td>
                    <td className="sm:p-4 py-2 sm:text-right align-middle w-full sm:w-48">
                      <div className="flex items-center gap-3 w-full justify-end">
                        <span className="text-xs text-slate-500 hidden sm:inline-block w-8">{progressWidth}%</span>
                        <div className="h-2 w-full sm:w-24 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div 
                            className={`h-full rounded-full ${progressWidth > 70 ? 'bg-emerald-500' : progressWidth > 40 ? 'bg-blue-500' : 'bg-slate-400'}`} 
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 lg:px-12 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-500 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
        
        <ProfileSummary />
        
        {user.role === 'buyer' ? renderBuyerDashboard() : renderArtisanDashboard()}
      </div>
    </main>
  )
}
