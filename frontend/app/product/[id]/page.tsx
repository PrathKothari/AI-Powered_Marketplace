'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types/product'
import { getCatalogProducts, getProductReviews, addProductReview } from '@/lib/api'
import ProductCard from '@/components/product-card'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const addToCartRef = useRef<HTMLDivElement | null>(null)
  
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loadingProduct, setLoadingProduct] = useState(true)

  // Reviews state
  interface Review { reviewId?: string; name: string; rating: number; comment: string; createdAt?: string; }
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReviewName, setNewReviewName] = useState("")
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewComment, setNewReviewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCatalogProducts().then((data) => {
      const products: Product[] = data.map((doc: any) => ({
        id: doc.productId ?? doc.id,
        name: doc.title ?? doc.name ?? 'Untitled Painting',
        price: doc.price ?? 0,
        description: doc.description ?? '',
        images: Array.isArray(doc.images) ? doc.images : [],
        status: (() => {
          if (!doc.active) return 'out-of-stock'
          const s = doc.stock ?? 0
          if (s === 0) return 'out-of-stock'
          if (s <= 5) return 'low-stock'
          return 'in-stock'
        })(),
        stock: doc.stock,
        artisan: { name: doc.artisanId ?? 'Unknown Artisan', location: doc.region ?? '', avatar: '' },
        category: doc.craftType ?? '',
        rating: doc.rating ?? 0,
        relatedProducts: [],
      }))
      setAllProducts(products)
      setProduct(products.find(p => String(p.id) === String(productId)))
      setLoadingProduct(false)
    }).catch(() => setLoadingProduct(false))

    // Fetch reviews from backend
    getProductReviews(productId).then(setReviews).catch(() => {})
  }, [productId])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewName || !newReviewComment || submitting) return
    setSubmitting(true)
    try {
      const saved = await addProductReview(productId, {
        name: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
      })
      setReviews((prev) => [saved, ...prev])
      setNewReviewName("")
      setNewReviewRating(5)
      setNewReviewComment("")
      toast.success('Review posted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to post review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : (product?.rating ?? 0) > 0
    ? (product!.rating!).toFixed(1)
    : "0.0"

  const relatedProducts = useMemo<Product[]>(() => {
    if (!product?.relatedProducts) return []
    return product.relatedProducts
      .map((id: string | number) => allProducts.find((item: Product) => String(item.id) === String(id)))
      .filter((p: Product | undefined): p is Product => Boolean(p))
  }, [product, allProducts])

  const recommendedCategoryProducts = useMemo<Product[]>(() => {
    if (!product || allProducts.length === 0) return []
    
    // Filter by same category, excluding the current product
    const sameCategory = allProducts.filter(p => p.category === product.category && String(p.id) !== String(product.id))
    
    // If none found in same category, use first 3 from allProducts (excluding current product)
    if (sameCategory.length === 0) {
       return allProducts.filter(p => String(p.id) !== String(product.id)).slice(0, 3)
    }
    
    return sameCategory.slice(0, 3)
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
    // Optional: provide feedback or redirect
    router.push('/buyer/cart')
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
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
              <p className="text-lg font-semibold text-primary mb-2">₹{product.price.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

              {/* Artisan Info */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase flex-shrink-0">
                  {product.artisan.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{product.artisan.name}</p>
                  <p className="text-xs text-muted-foreground">{product.artisan.location}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Verified Artisan
                  </span>
                  {(product.rating ?? 0) > 4 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ⭐ Top Artisan
                    </span>
                  )}
                </div>
              </div>

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

            {/* Ratings & Reviews (Dynamic UI) */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-6">Ratings & Reviews</h2>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-6 h-6 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} 
                    />
                  ))}
                </div>
                <div className="text-lg font-bold text-slate-800">{averageRating}</div>
                <div className="text-sm text-muted-foreground">({reviews.length} reviews)</div>
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleReviewSubmit} className="mb-8 space-y-4 p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 mb-2">Write a Review</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    required 
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-primary transition-all text-sm"
                  />
                  <select 
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-primary transition-all text-sm bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5) Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ (4) Good</option>
                    <option value={3}>⭐⭐⭐ (3) Average</option>
                    <option value={2}>⭐⭐ (2) Poor</option>
                    <option value={1}>⭐ (1) Terrible</option>
                  </select>
                </div>
                <textarea 
                  placeholder="Tell us what you loved about this craft..." 
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-primary transition-all h-24 resize-none text-sm"
                />
                <Button type="submit" className="px-6 font-bold" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Review'}
                </Button>
              </form>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800">{review.name}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed rounded-lg">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </div>
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
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => {
                    if (!product) return
                    addToCart({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] ?? '' })
                    router.push('/buyer/cart')
                  }}
                >
                  Buy Now
                </Button>
              </div>
            </Card>
          </aside>
        </div>

        {/* You may also like Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-border pb-4">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedCategoryProducts.map((p) => (
              <ProductCard key={p.id} product={p as Product} onDeleteAction={() => {}} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

