'use client'

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, Package, BarChart3, ArrowRight, Lightbulb, AlertCircle } from "lucide-react"

type ProductInventory = {
  id: number
  name: string
  stock: number
  sales: number
  trend: "high" | "low" | "stable"
}
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getMyListings, updateListing, deleteListing } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Plus, ArrowLeft, Star, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function InventoryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Edit modal state
  const [editItem, setEditItem] = useState<any>(null)
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '', materials: '' })
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const openEdit = (item: any) => {
    setEditItem(item)
    setEditForm({
      title: item.title ?? '',
      price: String(item.price ?? ''),
      description: item.description ?? '',
      materials: item.materials ?? '',
    })
  }

  const handleEditSave = async () => {
    if (!editItem) return
    setEditSaving(true)
    try {
      const updated = await updateListing(editItem.productId, {
        title: editForm.title,
        price: parseFloat(editForm.price),
        description: editForm.description,
        materials: editForm.materials,
      })
      setListings(prev => prev.map(l => l.productId === editItem.productId ? { ...l, ...updated } : l))
      toast.success('Listing updated!')
      setEditItem(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update listing')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    setDeleteLoading(true)
    try {
      await deleteListing(productId)
      setListings(prev => prev.filter(l => l.productId !== productId))
      toast.success('Listing deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listing')
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const lowStock = listings.filter(p => (p.stock ?? 0) <= 3)

export default function SmartInventoryPage() {
  const router = useRouter()

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
        <Button className="gap-2" onClick={() => router.push("/analytics") }>
          View Detailed Analytics
          <ArrowRight className="w-4 h-4" />
        <Button onClick={() => router.push('/sell')} className="gap-2">
          <Plus className="w-4 h-4" /> List New Painting
        </Button>
      </div>

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
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => setDeleteId(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Listing</h2>
                <button onClick={() => setEditItem(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold">Title</label>
                  <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Price (₹)</label>
                  <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Materials</label>
                  <Input value={editForm.materials} onChange={e => setEditForm(f => ({ ...f, materials: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditItem(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm bg-white rounded-2xl shadow-2xl">
            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Delete Listing?</h2>
              <p className="text-muted-foreground text-sm">This action cannot be undone. The painting will be permanently removed.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
