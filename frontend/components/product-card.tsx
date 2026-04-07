"use client"

import { useState } from "react"
import { Edit2, Eye, Trash2, ShoppingCart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Product } from "@/lib/types/product"
import { useCart } from "@/context/CartContext"

interface ProductCardProps {
  product: Product
  onDeleteAction: (id: string) => void
}

export default function ProductCard({ product, onDeleteAction }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { addToCart } = useCart()

  const getStatusColor = () => {
    switch (product.status) {
      case "in-stock":
        return "bg-accent/10 text-accent"
      case "low-stock":
        return "bg-orange-100/50 text-orange-700"
      case "out-of-stock":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = () => {
    switch (product.status) {
      case "in-stock":
        return "In Stock"
      case "low-stock":
        return "Low Stock"
      case "out-of-stock":
        return "Out of Stock"
      default:
        return "Unknown"
    }
  }

  const handleAddCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
    })
    // Optional: provide visual feedback or redirect
    router.push('/buyer/cart')
  }

  return (
    <Card
      onClick={() => {
        router.push(`/product/${product.id}`)
      }}
      className={`overflow-hidden border-accent/20 bg-card cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg ${
        isHovered ? "-translate-y-1" : "shadow-sm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-muted h-48">
        <img
          src={product.images?.[0] ?? '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Status Badge */}
        <div
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}
        >
          {getStatusText()}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground text-lg line-clamp-1">{product.name}</h3>
            <p className="text-primary font-bold text-lg">${product.price.toFixed(2)}</p>
          </div>
          {product.relatedProducts?.length ? (
            <p className="text-xs text-muted-foreground mt-1">{product.relatedProducts.length} related products</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs bg-primary hover:bg-primary/90"
            onClick={handleAddCart}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-accent/20 hover:bg-accent/10"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/product/${product.id}`)
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs hover:bg-muted text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteAction(product.id)
            }}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs hover:bg-muted text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              // Edit functionality
            }}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </Card>
  )
}
