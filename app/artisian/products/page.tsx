"use client"

import { useState } from "react"
import { Search, Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import ProductCard from "@/components/product-card"
import StatsBar from "@/components/stats-bar"
import EmptyState from "@/components/empty-state"
import FilterBar from "@/components/filter-bar"

export default function MyProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Handwoven Basket",
      price: 45.0,
      image: "/handwoven-basket-artisan-craft.jpg",
      status: "in-stock",
      sold: 12,
    },
    {
      id: 2,
      name: "Ceramic Mug Set",
      price: 35.0,
      image: "/ceramic-mug-handmade-pottery.jpg",
      status: "in-stock",
      sold: 8,
    },
    {
      id: 3,
      name: "Leather Journal",
      price: 28.0,
      image: "/leather-journal-handcrafted.jpg",
      status: "low-stock",
      sold: 5,
    },
    {
      id: 4,
      name: "Macramé Wall Hanging",
      price: 52.0,
      image: "/macrame-wall-art-boho.jpg",
      status: "out-stock",
      sold: 0,
    },
  ])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterStatus === "all" || product.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const totalProducts = products.length
  const activeListings = products.filter((p) => p.status !== "out-stock").length
  const soldThisMonth = products.reduce((sum, p) => sum + p.sold, 0)

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1">
        {/* Top Header */}
        <div className="border-b border-accent/20 bg-card">
          <div className="max-w-7xl mx-auto px-6 py-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">My Products</h1>
              <p className="text-muted-foreground">
                Manage and showcase your handmade creations
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-5 h-5 mr-2" />
              Add New Product
            </Button>
          </div>
        </div>

        <StatsBar
          totalProducts={totalProducts}
          activeListings={activeListings}
          soldThisMonth={soldThisMonth}
        />

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search & Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search your crafts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-accent/20"
              />
            </div>

            <FilterBar
              activeFilter={filterStatus}
              onFilterChange={setFilterStatus}
            />
          </div>

          {/* Products Area */}
          {filteredProducts.length === 0 &&
          searchQuery === "" &&
          filterStatus === "all" ? (
            <EmptyState />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No products match your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="mt-12 flex justify-center">
              <Button variant="outline" className="border-accent/20 bg-transparent">
                Load More
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
