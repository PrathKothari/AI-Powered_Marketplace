'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ExternalLink } from 'lucide-react'
import { fetchApi } from '@/lib/api'

interface FeaturedProductProps {
  productId: string
}

interface Product {
  productId: string
  title: string
  price: number
  description: string
  images: string[]
  craftType: string
  region: string
  artisanName: string
}

export default function FeaturedProduct({ productId }: FeaturedProductProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi<Product>(`/catalog/${productId}`)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) {
    return (
      <Card className="p-4 bg-white animate-pulse">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-1/3 mt-2" />
          </div>
        </div>
      </Card>
    )
  }

  if (!product) return null

  return (
    <Card className="p-4 bg-white border-2 border-primary/20">
      <div className="flex gap-4 items-center">
        {/* Product image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.craftType} &middot; {product.region}</p>
          <h4 className="font-bold text-foreground truncate">{product.title}</h4>
          <p className="text-lg font-bold text-primary mt-1">&#8377;{product.price.toLocaleString('en-IN')}</p>
        </div>

        {/* Buy button */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link href={`/product/${product.productId}`}>
            <Button className="gap-2 whitespace-nowrap">
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </Button>
          </Link>
          <Link href={`/product/${product.productId}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" /> View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
