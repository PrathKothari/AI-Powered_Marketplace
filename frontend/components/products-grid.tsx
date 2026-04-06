'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Heart, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

const products = [
  {
    id: 1,
    title: 'Handwoven Ceramic Vase',
    price: '$85.00',
    rating: 4.8,
    reviews: 124,
    seller: 'Pottery Artisan Studio',
    image: 'bg-gradient-to-br from-amber-100 to-orange-50',
  },
  {
    id: 2,
    title: 'Leather Crafted Journal',
    price: '$45.00',
    rating: 4.9,
    reviews: 89,
    seller: 'Leather Workshop Co.',
    image: 'bg-gradient-to-br from-rose-100 to-pink-50',
  },
  {
    id: 3,
    title: 'Hand-Painted Silk Scarf',
    price: '$65.00',
    rating: 4.7,
    reviews: 156,
    seller: 'Silk Painters Collective',
    image: 'bg-gradient-to-br from-blue-100 to-cyan-50',
  },
  {
    id: 4,
    title: 'Wooden Jewelry Box',
    price: '$120.00',
    rating: 5.0,
    reviews: 201,
    seller: 'Woodcraft Masters',
    image: 'bg-gradient-to-br from-yellow-100 to-lime-50',
  },
  {
    id: 5,
    title: 'Knitted Wool Blanket',
    price: '$95.00',
    rating: 4.8,
    reviews: 112,
    seller: 'Fiber Arts Studio',
    image: 'bg-gradient-to-br from-purple-100 to-indigo-50',
  },
  {
    id: 6,
    title: 'Handcrafted Wooden Bowl',
    price: '$55.00',
    rating: 4.6,
    reviews: 87,
    seller: 'Wood Turnings Lab',
    image: 'bg-gradient-to-br from-green-100 to-emerald-50',
  },
  {
    id: 7,
    title: 'Artisan Coffee Mug Set',
    price: '$48.00',
    rating: 4.9,
    reviews: 234,
    seller: 'Ceramic Designs Co.',
    image: 'bg-gradient-to-br from-orange-100 to-red-50',
  },
  {
    id: 8,
    title: 'Hand-Stitched Pillow Cover',
    price: '$38.00',
    rating: 4.7,
    reviews: 143,
    seller: 'Textile Makers',
    image: 'bg-gradient-to-br from-pink-100 to-rose-50',
  },
]

export default function ProductsGrid() {
  const [favorites, setFavorites] = useState<number[]>([])
  const { addToCart } = useCart()

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    )
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 underline decoration-primary decoration-4 underline-offset-8">Featured Products</h2>
          <p className="text-muted-foreground text-lg">
            Handpicked selections from our talented artisan community
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden bg-card border-border hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Product Image */}
              <div className={`h-48 ${product.image} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      favorites.includes(product.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({product.reviews})
                  </span>
                </div>

                {/* Seller */}
                <p className="text-xs text-muted-foreground italic opacity-70">{product.seller}</p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                  <p className="text-xl font-bold text-primary font-mono">{product.price}</p>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    onClick={() => {
                      const parsedPrice = parseFloat(product.price.replace('$', '')) || 0;
                      addToCart({
                        id: product.id,
                        name: product.title,
                        price: parsedPrice,
                        image: product.image,
                      });
                    }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
