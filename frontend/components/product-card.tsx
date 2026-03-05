"use client"

import { useState } from "react"
import { Edit2, Eye, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Product {
  id: number
  name: string
  price: number
  image: string
  status: "in-stock" | "low-stock" | "out-stock"
  sold: number
}

interface ProductCardProps {
  product: Product
  onDelete: (id: number) => void
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = () => {
    switch (product.status) {
      case "in-stock":
        return "bg-accent/10 text-accent"
      case "low-stock":
        return "bg-orange-100/50 text-orange-700"
      case "out-stock":
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
      case "out-stock":
        return "Out of Stock"
      default:
        return "Unknown"
    }
  }

  return (
    <Card
      className={`overflow-hidden border-accent/20 bg-card transition-all duration-300 ${
        isHovered ? "shadow-lg -translate-y-1" : "shadow-sm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
<div className="relative overflow-hidden bg-muted h-48">
  <img
    src={product.image}
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


      {/* Card Content */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-lg mb-1">{product.name}</h3>
          <p className="text-primary font-bold text-lg">${product.price.toFixed(2)}</p>
          {product.sold > 0 && <p className="text-xs text-muted-foreground mt-1">{product.sold} sold this month</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs hover:bg-accent/10">
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs hover:bg-accent/10">
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs hover:bg-destructive/10 text-destructive"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
