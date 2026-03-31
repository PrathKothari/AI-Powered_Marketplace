// UNUSED - safe to delete (duplicate of components/product-card.tsx and not imported anywhere)
"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Product {
  id: number
  name: string
  price: number
  image: string
  status: string
  sold: number
}

interface ProductCardProps {
  product: Product
  onDeleteAction: (id: number) => void
}

export default function ProductCard({ product, onDeleteAction }: ProductCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="relative h-48 bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 right-3 px-2 py-1 text-xs rounded-full bg-black/70 text-white">
          {product.status}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground">₹{product.price}</p>
        <p className="text-xs text-muted-foreground">Sold: {product.sold}</p>

        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => onDeleteAction(product.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
