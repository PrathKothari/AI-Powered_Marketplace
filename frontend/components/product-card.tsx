'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Star, StarHalf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types/product'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  onDeleteAction?: (id: string) => void
}

export default function ProductCard({ product, onDeleteAction }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const getStatusStyle = () => {
    switch (product.status) {
      case "in-stock":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200/50"
      case "low-stock":
        return "bg-amber-500/10 text-amber-700 border-amber-200/50"
      case "out-of-stock":
        return "bg-red-500/10 text-red-700 border-red-200/50"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200/50"
    }
  }

  const getStatusText = () => {
    switch (product.status) {
      case "in-stock": return "In Stock"
      case "low-stock": return "Low Stock"
      case "out-of-stock": return "Out of Stock"
      default: return "Unknown"
    }
  }

  const [isAdded, setIsAdded] = useState(false)
  const { addToCart } = useCart()

  const handleAddCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
    })
    setIsAdded(true)
    toast.success(`${product.name} added to cart!`, {
      description: "Your treasures are waiting in the basket.",
      action: {
        label: "View Cart",
        onClick: () => router.push('/buyer/cart'),
      },
    })
    setTimeout(() => setIsAdded(false), 2500)
  }

  // Safely fallback to 4.5 if rating is undefined, for demo purposes
  const rating = product.rating || 4.5
  const reviewCount = product.sold !== undefined ? product.sold * 3 : Math.floor(Math.random() * 120) + 15

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)
      } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
        stars.push(<StarHalf key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-gray-300" />)
      }
    }
    return stars
  }

  return (
    <div 
      onClick={() => router.push(`/product/${product.id}`)}
      className="group relative flex flex-col bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Zoom Effect */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-muted/40">
        <img
          src={product.images?.[0] || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
        />
        
        {/* Subtle Dark Gradient Overlay for Badge Contrast */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusStyle()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Category & Info */}
        <div className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center justify-between">
          <span className="uppercase tracking-wider">{product.category || 'Handcrafted'}</span>
          {product.artisan?.name && (
            <span className="truncate max-w-[50%]">by {product.artisan.name}</span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        {/* Ratings UI */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {renderStars()}
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-0.5">
            <span className="text-foreground">{rating}</span> ({reviewCount})
          </span>
        </div>

        {/* Price & Action Area - Pushed to bottom */}
        <div className="mt-auto pt-4 flex flex-col gap-3">
          <div className="flex items-end gap-0.5">
            <span className="text-sm font-semibold text-foreground mb-0.5">$</span>
            <span className="text-2xl font-extrabold text-foreground leading-none tracking-tight">
              {Math.floor(product.price)}
            </span>
            <span className="text-sm font-semibold text-foreground leading-none mb-1">
              {(product.price % 1).toFixed(2).substring(1)}
            </span>
          </div>

          <Button
            onClick={handleAddCart}
            disabled={isAdded}
            className={`w-full font-bold shadow-md hover:shadow-lg transition-all duration-500 active:scale-[0.98] py-5 rounded-xl flex items-center justify-center gap-2 ${
              isAdded 
                ? "bg-emerald-500 text-white scale-[1.02]" 
                : "bg-linear-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
            }`}
          >
            {isAdded ? (
              <div className="flex items-center gap-2 animate-success-check">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Added!
              </div>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
