"use client"

import { useState } from "react"
import { Eye, ShoppingCart, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Product } from "@/lib/types/product"
import { useCart } from "@/context/CartContext"

interface ProductCardProps {
  product: Product
  onDeleteAction?: (id: string) => void
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { addToCart } = useCart()

  const getStatusStyle = () => {
    switch (product.status) {
      case "in-stock":
        return "bg-emerald-500 text-white"
      case "low-stock":
        return "bg-orange-500 text-white"
      case "out-of-stock":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusText = () => {
    if (product.status === "in-stock") {
      return product.stock ? `In Stock (${product.stock})` : "In Stock"
    }
    if (product.status === "low-stock") {
      return product.stock ? `Low Stock (${product.stock})` : "Low Stock"
    }
    if (product.status === "out-of-stock") return "Out of Stock"
    return "Unknown"
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
    })
    router.push(`/product/${product.id}`)
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/product/${product.id}`)
  }

  return (
    <Card
      onClick={() => router.push(`/product/${product.id}`)}
      className={`overflow-hidden border-border bg-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isHovered ? "shadow-lg" : "shadow-sm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted h-52">
        <img
          src={product.images?.[0] ?? '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
        />

        {/* Status Badge — always solid and visible */}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow ${getStatusStyle()}`}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-foreground text-base line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>
          <p className="text-primary font-bold text-lg shrink-0">₹{product.price.toFixed(0)}</p>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(product.rating ?? 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-muted text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          {(product.rating ?? 0) > 0 ? (
            <span className="text-xs text-muted-foreground font-medium">
              {(product.rating ?? 0).toFixed(1)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">No ratings yet</span>
          )}
        </div>

        {product.artisan?.location && (
          <p className="text-xs text-muted-foreground">{product.artisan.location}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleAddToCart}
            disabled={product.status === "out-of-stock"}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Add to Cart
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-white border border-primary/20 text-primary font-bold font-outfit uppercase tracking-wider text-[10px] transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-[0.95] hover:bg-white hover:shadow-md"
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
