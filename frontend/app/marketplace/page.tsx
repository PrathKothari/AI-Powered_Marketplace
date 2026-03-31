'use client'

import { useState, useMemo, useEffect } from 'react'
import Navbar from "@/components/navbar"
import FilterSidebar from "@/components/filter-sidebar"
import ProductCard from "@/components/product-card"
import { Product } from "@/lib/types/product"
import { getProducts } from "@/lib/products"

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  const [rawProducts, setRawProducts] = useState<Product[]>([])

  useEffect(() => {
    setRawProducts(getProducts());
  }, [])

  const filteredProducts = useMemo(() => {
    let products = [...rawProducts]

    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (sortBy === "price-low") {
      products.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      products.sort((a, b) => b.price - a.price)
    }

    return products
  }, [searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex max-w-7xl mx-auto px-6 py-8 gap-6">

        {/* Sidebar */}
        <div className="w-64 hidden lg:block">
          <FilterSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1">

          {/* Top bar */}
          <div className="flex justify-between items-center mb-6">
            <input
              type="text"
              placeholder="Search products..."
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
          {filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No products found
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onDeleteAction={() => {}} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}