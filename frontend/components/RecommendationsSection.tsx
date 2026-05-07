'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { getRecommendations, getCatalogProducts, type RecommendationItem } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { Card } from '@/components/ui/card'

interface RecommendationsSectionProps {
  title?: string
  subtitle?: string
  excludeIds?: string[]
  limit?: number
  className?: string
}

/**
 * Shows AI-powered painting recommendations.
 * Uses the current cart to personalize results. Falls back to trending if no cart.
 */
export default function RecommendationsSection({
  title = 'Recommended for you',
  subtitle = 'AI-curated picks based on your taste',
  excludeIds = [],
  limit = 6,
  className = '',
}: RecommendationsSectionProps) {
  const { cartItems } = useCart()
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [productImages, setProductImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cartSignals = (cartItems || []).map((item) => ({
      productId: String(item.id || ''),
      title: item.name,
      price: typeof item.price === 'number' ? item.price : undefined,
    }))

    Promise.all([
      getRecommendations({ cartItems: cartSignals, excludeIds, limit }),
      getCatalogProducts(),
    ])
      .then(([recs, products]) => {
        setRecommendations(recs)
        // Build a productId -> image URL map for thumbnails
        const imgMap: Record<string, string> = {}
        for (const p of products) {
          const pid = p.productId || p.id
          if (pid && Array.isArray(p.images) && p.images[0]) {
            imgMap[pid] = p.images[0]
          }
        }
        setProductImages(imgMap)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems?.length])

  if (loading) {
    return (
      <section className={className}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3 bg-white animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-lg mb-3" />
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map((rec) => {
          const image = productImages[rec.productId]
          return (
            <Link key={rec.productId} href={`/product/${rec.productId}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-white">
                <div className="aspect-square bg-white overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img
                      src={image}
                      alt={rec.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm text-foreground truncate">{rec.title}</h3>
                  {rec.price != null && (
                    <p className="text-sm font-bold text-primary">&#8377;{rec.price.toLocaleString('en-IN')}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground line-clamp-2 italic">{rec.reason}</p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
