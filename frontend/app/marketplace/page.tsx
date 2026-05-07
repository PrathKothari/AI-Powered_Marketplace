'use client'


import { useState, useMemo, useEffect } from 'react'
import Navbar from "@/components/navbar"
import FilterSidebar from "@/components/filter-sidebar"
import ProductCard from "@/components/product-card"
import { Product } from "@/lib/types/product"
import { getProducts } from "@/lib/products"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarketplaceFilters {
  categories: string[]
  priceRange: [number, number]
  availability: string[]
  rating: number
}
import { getCategories, getCatalogProducts } from "@/lib/api"

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  availability: string[];
  rating: number;
}

function deriveStatus(doc: any): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (!doc.active) return 'out-of-stock'
  const stock = doc.stock ?? 0
  if (stock === 0) return 'out-of-stock'
  if (stock <= 5) return 'low-stock'
  return 'in-stock'
}

/** Map a Firestore ProductBase document to the frontend Product type */
function mapFirestoreProduct(doc: any): Product {
  return {
    id: doc.productId ?? doc.id,
    name: doc.title ?? doc.name ?? 'Untitled Painting',
    price: doc.price ?? 0,
    description: doc.description ?? '',
    images: Array.isArray(doc.images) ? doc.images : [],
    status: deriveStatus(doc),
    stock: doc.stock,
    artisan: {
      name: doc.artisanId ?? 'Unknown Artisan',
      location: doc.region ?? '',
      avatar: '',
    },
    category: doc.craftType ?? '',
    rating: doc.rating ?? 0,
    relatedProducts: [],
  }
}

const PAGE_SIZE = 12

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  const [rawProducts, setRawProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<MarketplaceFilters>({
    categories: [],
    priceRange: [0, 1000],
    availability: [],
    rating: 0,
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRawProducts(getProducts())
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  const [loading, setLoading] = useState(true)
  const [categoryNames, setCategoryNames] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 2000],
    availability: [],
    rating: 0,
  })

  useEffect(() => {
    getCatalogProducts().then((data) => {
      setRawProducts(data.map(mapFirestoreProduct))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    getCategories().then((data) => {
      const names = (data as any[]).map((c) => c.name).filter(Boolean)
      setCategoryNames(names)
    })
  }, [])

  // Reset to page 1 whenever filters/search/sort change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, sortBy, filters])

  const filteredProducts = useMemo(() => {
    let products = [...rawProducts]

    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filters.categories.length > 0) {
      products = products.filter((p) =>
        p.category ? filters.categories.includes(p.category) : false
      )
    }

    if (filters.availability.length > 0) {
      products = products.filter((p) => {
        const status = p.status === 'out-of-stock' ? 'Out of Stock' : 'In Stock'
        return filters.availability.includes(status)
      })
        p.category && filters.categories.includes(p.category)
      )
    }

    products = products.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    if (filters.availability.length > 0) {
      const statusMap: Record<string, string> = {
        'In Stock': 'in-stock',
        'Out of Stock': 'out-of-stock',
      }
      products = products.filter((p) =>
        filters.availability.some(
          (a) => statusMap[a] === p.status || (a === 'In Stock' && p.status === 'low-stock')
        )
      )
    }

    if (filters.rating > 0) {
      products = products.filter((p) => (p.rating ?? 0) >= filters.rating)
    }

    products = products.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    if (sortBy === "price-low") {
      products.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      products.sort((a, b) => b.price - a.price)
    } else {
      products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    }

    return products
  }, [searchQuery, sortBy, rawProducts, filters])

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 gap-6 w-full overflow-x-hidden">

        {/* Sidebar */}
        <div className="w-full lg:w-64 mb-6 lg:mb-0 lg:block">
          <FilterSidebar onFilterChange={setFilters} />
      <div className="flex max-w-7xl mx-auto px-6 py-8 gap-6">
        {/* Sidebar */}
        <div className="w-64 hidden lg:block">
          <FilterSidebar
            categories={categoryNames}
            onFilterChange={setFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-6">
            <input
              type="text"
              placeholder="Search paintings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-4 py-2 rounded-lg w-1/2"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="popular">Popular</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-3xl border border-border/40 overflow-hidden h-full flex flex-col p-4 space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-12 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Empty className="py-24 animate-in fade-in zoom-in-95 duration-500">
               <EmptyMedia variant="icon" className="bg-slate-50 text-slate-300 ring-4 ring-slate-50/50">
                  <ShoppingBag className="w-8 h-8" />
               </EmptyMedia>
               <EmptyHeader>
                  <EmptyTitle className="text-2xl font-black text-slate-900 tracking-tight">No treasures found</EmptyTitle>
                  <EmptyDescription className="text-slate-500 max-w-xs mx-auto font-medium">
                    We couldn't find any products matching your current filters. Try adjusting your search or category selection.
                  </EmptyDescription>
               </EmptyHeader>
               <Button 
                variant="outline" 
                onClick={() => setFilters({ categories: [], priceRange: [0, 1000], availability: [], rating: 0 })}
                className="rounded-xl border-2 border-slate-200 hover:border-primary hover:text-primary font-bold px-8"
              >
                 Clear All Filters
               </Button>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onDeleteAction={() => {}} />
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground mt-16">No paintings found</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onDeleteAction={() => {}} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isNearCurrent = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages
                    const isEllipsisBefore = page === currentPage - 2 && currentPage > 3
                    const isEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2
                    if (isEllipsisBefore || isEllipsisAfter) {
                      return <span key={page} className="px-1 text-muted-foreground">…</span>
                    }
                    if (!isNearCurrent) return null
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border hover:bg-secondary'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground mt-3">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} paintings
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
