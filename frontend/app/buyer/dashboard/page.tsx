'use client'

import { useState, useMemo } from 'react'
import { Heart, ShoppingCart, LogOut, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Toggle } from '@/components/ui/toggle'
import { Skeleton } from '@/components/ui/skeleton'

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: 'Handwoven Wool Blanket',
    artisan: 'Maria López',
    region: 'Americas',
    category: 'Textiles',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Ceramic Serving Bowl',
    artisan: 'Kenji Tanaka',
    region: 'Asia',
    category: 'Ceramics',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    rating: 5.0,
  },
  {
    id: 3,
    name: 'Beaded Necklace',
    artisan: 'Zuri Okafor',
    region: 'Africa',
    category: 'Jewelry',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
    rating: 4.9,
  },
  {
    id: 4,
    name: 'Leather Shoulder Bag',
    artisan: 'Isabella Romano',
    region: 'Europe',
    category: 'Leather Goods',
    price: 125.00,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    rating: 4.7,
  },
  {
    id: 5,
    name: 'Silk Scarves Set',
    artisan: 'Amira Hassan',
    region: 'Africa',
    category: 'Textiles',
    price: 72.50,
    image: 'https://images.unsplash.com/photo-1599643478813-87ba37b58dac?w=400&h=400&fit=crop',
    rating: 4.9,
  },
  {
    id: 6,
    name: 'Hand-thrown Vase',
    artisan: 'Chen Wei',
    region: 'Asia',
    category: 'Ceramics',
    price: 95.00,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    rating: 5.0,
  },
  {
    id: 7,
    name: 'Turquoise Pendant',
    artisan: 'Sarah White Eagle',
    region: 'Americas',
    category: 'Jewelry',
    price: 55.99,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
    rating: 4.8,
  },
  {
    id: 8,
    name: 'Handmade Wooden Box',
    artisan: 'Lukas Schneider',
    region: 'Europe',
    category: 'Wood Crafts',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1599082867971-aa66c5c27551?w=400&h=400&fit=crop',
    rating: 4.9,
  },
]

const featuredProducts = mockProducts.slice(0, 4)

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [priceRange, setPriceRange] = useState('All')
  const [handmadeOnly, setHandmadeOnly] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [wishlist, setWishlist] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([mockProducts[0].id])

  const categories = ['All', 'Textiles', 'Ceramics', 'Jewelry', 'Leather Goods', 'Wood Crafts']
  const regions = ['All', 'Asia', 'Africa', 'Americas', 'Europe']
  const priceRanges = [
    { value: 'All', label: 'All Prices' },
    { value: '0-50', label: 'Under $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100+', label: '$100+' },
  ]

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artisan.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesRegion = selectedRegion === 'All' || product.region === selectedRegion

      let matchesPrice = true
      if (priceRange !== 'All') {
        const [min, max] = priceRange.split('-').map(Number)
        if (max) {
          matchesPrice = product.price >= min && product.price <= max
        } else {
          matchesPrice = product.price >= min
        }
      }

      return matchesSearch && matchesCategory && matchesRegion && matchesPrice
    })

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price)
    }

    return result
  }, [searchQuery, selectedCategory, selectedRegion, priceRange, sortBy])

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const viewProduct = (productId: number) => {
    if (!recentlyViewed.includes(productId)) {
      setRecentlyViewed((prev) => [productId, ...prev].slice(0, 5))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Explore Handmade Crafts</h1>
              <p className="text-sm text-muted-foreground">
                Discover unique products from artisans around the world
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Crafts Section */}
      <section className="border-b border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Featured Crafts</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0">
                  <Card className="overflow-hidden transition-transform hover:scale-105">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-40 w-40 object-cover"
                    />
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Section */}
        <section className="mb-8">
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Search crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="default">Search</Button>
            </div>

            {/* Filter Controls */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Toggle
                pressed={handmadeOnly}
                onPressedChange={setHandmadeOnly}
                className="justify-center"
              >
                Handmade Only
              </Toggle>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No products found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="relative overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 transition-all hover:bg-white"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        wishlist.includes(product.id)
                          ? 'fill-primary text-primary'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.artisan}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{product.region}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-xs font-medium text-foreground">{product.rating}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="mb-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">${product.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => viewProduct(product.id)}
                        variant="default"
                        className="flex-1"
                        size="sm"
                      >
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="px-3">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Recently Viewed</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentlyViewed.map((productId) => {
                const product = mockProducts.find((p) => p.id === productId)
                if (!product) return null
                return (
                  <Card
                    key={product.id}
                    className="group overflow-hidden transition-all hover:shadow-lg opacity-75"
                  >
                    <div className="relative overflow-hidden bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.artisan}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-primary">${product.price}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
