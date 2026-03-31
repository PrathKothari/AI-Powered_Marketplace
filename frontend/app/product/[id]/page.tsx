'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { addToCart } from '@/lib/cart'
import { Product } from '@/lib/types/product'
import { getProducts } from '@/lib/products'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const addToCartRef = useRef<HTMLDivElement | null>(null)

  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    const products = getProducts()
    setAllProducts(products)
    setProduct(products.find(p => String(p.id) === String(productId)))
  }, [productId])

  const relatedProducts = useMemo<Product[]>(() => {
    if (!product?.relatedProducts) return []
    return product.relatedProducts
      .map((id: string | number) => allProducts.find((item: Product) => String(item.id) === String(id)))
      .filter((p: Product | undefined): p is Product => Boolean(p))
  }, [product, allProducts])

  const storyVideo = product?.storyVideo || 'https://www.w3schools.com/html/mov_bbb.mp4'

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
    })
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 rounded-xl border border-border bg-card drop-shadow">
          <h1 className="text-2xl font-bold mb-3">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you are looking for could not be found.</p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link href="/marketplace" className="text-sm text-primary hover:underline flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
              <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
              <p className="text-lg font-semibold text-indigo-600 mb-2">${product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

              <div className="grid grid-cols-2 gap-4">
                {product.images?.map((img: string, index: number) => (
                  <img
                    key={index}
                    src={img}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
              <h2 className="text-2xl font-semibold mb-4">Craft Story Video</h2>
              {storyVideo ? (
                <video src={storyVideo} controls className="w-full rounded-xl shadow" />
              ) : (
                <div className="h-60 flex items-center justify-center bg-muted rounded-xl">
                  <p className="text-muted-foreground">Story not available</p>
                </div>
              )}
            </div>

            {relatedProducts.length > 0 && (
              <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-3">Related Products</h3>
                <div className="space-y-2">
                  {relatedProducts.map((related) => (
                    <Link key={related.id} href={`/product/${related.id}`} className="block rounded-lg border p-3 hover:bg-slate-50">
                      <p className="font-medium">{related.name}</p>
                      <p className="text-xs text-muted-foreground">{related.category ?? 'Craft'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="p-5 border border-border">
              <div className="mb-4">
                <Badge className="capitalize">{product.status}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Category: {product.category ?? 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Rating: {product.rating?.toFixed(1) ?? 'No rating'}</p>
                <p className="text-sm text-muted-foreground">Artisan: {product.artisan.name}</p>
                <p className="text-sm text-muted-foreground">Location: {product.artisan.location}</p>
              </div>
              <div ref={addToCartRef} className="mt-6 space-y-3">
                <Button className="w-full" onClick={handleAddToCart}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => router.push('/cart')}>
                  Buy Now
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
