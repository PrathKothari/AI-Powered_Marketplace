'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, ShoppingCart, Star, StarHalf } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types/product'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  onDeleteAction?: (id: string) => void
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const router = useRouter()
  const { addToCart } = useCart()

  const getStatusStyle = () => {
    switch (product.status) {
      case 'in-stock':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50'
      case 'low-stock':
        return 'bg-amber-500/10 text-amber-700 border-amber-200/50'
      case 'out-of-stock':
        return 'bg-red-500/10 text-red-700 border-red-200/50'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200/50'
    }
  }

  const getStatusText = () => {
    if (product.status === 'in-stock') return product.stock ? `In Stock (${product.stock})` : 'In Stock'
    if (product.status === 'low-stock') return product.stock ? `Low Stock (${product.stock})` : 'Low Stock'
    if (product.status === 'out-of-stock') return 'Out of Stock'
    return 'Unknown'
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
    })
    setIsAdded(true)
    toast.success(`${product.name} added to cart!`, {
      description: 'Your treasures are waiting in the basket.',
      action: { label: 'View Cart', onClick: () => router.push('/buyer/cart') },
    })
    setTimeout(() => setIsAdded(false), 2500)
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/product/${product.id}`)
  }

  const rating = product.rating ?? 0
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
    <Card
      onClick={() => router.push(`/product/${product.id}`)}
      className="group overflow-hidden border-border bg-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-white h-52 flex items-center justify-center">
        <img
          src={product.images?.[0] || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
        />
        {/* Status Badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusStyle()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-foreground text-base line-clamp-2 leading-snug flex-1 group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-primary font-bold text-lg shrink-0">₹{product.price.toFixed(0)}</p>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">{renderStars()}</div>
          {rating > 0 ? (
            <span className="text-xs text-muted-foreground font-medium">{rating.toFixed(1)} ({reviewCount})</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">No ratings yet</span>
          )}
        </div>

        {product.artisan?.location && (
          <p className="text-xs text-muted-foreground">{product.artisan.location}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleAddToCart}
            disabled={isAdded || product.status === 'out-of-stock'}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            {isAdded ? 'Added!' : 'Add to Cart'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:text-slate-700 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleView}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </Button>
        </div>
      </div>
    </Card>
  )
}
