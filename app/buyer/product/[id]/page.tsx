'use client';
import { useParams } from "next/navigation"
import { useState, useEffect } from 'react';
import { ChevronLeft, Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/store/slices/cartSlice'
const mockProducts: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Hand-Woven Ceramic Bowl',
    price: 125,
    originalPrice: 150,
    artisanName: 'Elena García',
    region: 'Oaxaca, Mexico',
    category: 'Ceramics',
    rating: 4.8,
    reviews: 24,
    mainImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800&q=80',
    thumbnails: [
      'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80',
      'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80',
      'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80',
    ],
    description: 'A beautifully crafted ceramic bowl featuring traditional Oaxacan patterns. Each piece is wheel-thrown and hand-painted with natural pigments, making it completely unique.',
    materials: 'Clay from local Oaxacan sources, natural earth pigments, food-safe glaze',
    artisanStory: 'Elena has been creating pottery for over 15 years in her family workshop. She combines traditional techniques passed down through generations with modern design aesthetics, creating pieces that celebrate Mexican craftsmanship.',
    artisanImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    relatedProducts: [
      { id: '2', name: 'Handmade Coffee Mug', price: 45, image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80' },
      { id: '3', name: 'Decorative Plate Set', price: 185, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80' },
      { id: '4', name: 'Serving Platter', price: 95, image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80' },
      { id: '5', name: 'Small Ceramic Dish', price: 35, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80' },
    ],
  },
  '2': {
    id: '2',
    name: 'Hand-Woven Textile Blanket',
    price: 250,
    originalPrice: 280,
    artisanName: 'María López',
    region: 'Chiapas, Mexico',
    category: 'Textiles',
    rating: 4.9,
    reviews: 18,
    mainImage: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80',
    thumbnails: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80',
      'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80',
    ],
    description: 'A stunning hand-woven blanket featuring traditional patterns from Chiapas. Made with premium natural fibers, this piece combines functionality with artistic beauty.',
    materials: ' 100% organic cotton, natural dyes, hand-woven on traditional loom',
    artisanStory: 'María learned weaving from her grandmother and now passes this knowledge to her daughters. Her textiles are inspired by the rich cultural heritage of Chiapas and each piece tells a story.',
    artisanImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    relatedProducts: [
      { id: '1', name: 'Hand-Woven Ceramic Bowl', price: 125, image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80' },
      { id: '6', name: 'Woven Wall Hanging', price: 180, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80' },
      { id: '7', name: 'Decorative Pillow', price: 65, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80' },
      { id: '8', name: 'Table Runner', price: 75, image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&q=80' },
    ],
  },
};

 export default function ProductPage() {

  const dispatch = useAppDispatch()

  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const params = useParams()
  const id = params.id as string
  useEffect(() => {
    if (!id) return;
    
    // Simulate loading
    const timer = setTimeout(() => {
      const mockProduct = mockProducts[id] || mockProducts['1'];
      setProduct(mockProduct);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);
const handleAddToCart = () => {
  dispatch(
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.mainImage,
      quantity: quantity,
    })
  )
}
  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image gallery skeleton */}
            <div>
              <Skeleton className="w-full aspect-square rounded-lg mb-4" />
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product details skeleton */}
            <div>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
  href="/buyer/marketplace"
  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
>
  ← Back to Marketplace
</Link>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="hidden md:flex px-4 py-2 rounded-lg bg-muted text-sm border border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Link href="/buyer/cart">
  <Button variant="ghost" size="icon">
    <ShoppingCart className="w-5 h-5" />
  </Button>
</Link>
            <Avatar className="w-10 h-10 cursor-pointer" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-muted rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
              <Image
                src={product.mainImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.thumbnails.map((thumb: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                    selectedImage === idx
                      ? 'border-foreground'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <Image
                    src={thumb}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
                    {product.name}
                  </h1>
                  <p className="text-muted-foreground">{`By ${product.artisanName}`}</p>
                </div>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      isWishlisted
                        ? 'fill-destructive text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{product.region}</Badge>
                <Badge variant="outline">{product.category}</Badge>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pb-6 border-b border-border">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-foreground">
                  ${product.price}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
                <Badge className="bg-destructive text-destructive-foreground">
                  Save ${product.originalPrice - product.price}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                🚚 Free shipping on orders over $100
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border border-input rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 font-medium min-w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <Button
                size="lg"
                onClick={handleAddToCart}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-semibold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full font-semibold"
              >
                Buy Now
              </Button>
            </div>

            {/* Info Note */}
            <Card className="p-4 bg-muted/50 border-0">
              <p className="text-sm text-muted-foreground">
                ✨ <span className="font-semibold text-foreground">Handmade with Care</span> — Each piece is
                created individually, making it completely unique.
              </p>
            </Card>
          </div>
        </div>

        {/* Description Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 py-8 border-y border-border">
          <div>
            <h2 className="text-2xl font-serif font-bold mb-4">About This Piece</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {product.description}
            </p>

            <h3 className="text-lg font-semibold mb-3">Materials</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.materials}
            </p>
          </div>

          {/* Artisan Info */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">Meet the Artisan</h2>
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <Image
                    src={product.artisanImage}
                    alt={product.artisanName}
                    fill
                    className="object-cover"
                  />
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{product.artisanName}</h3>
                  <p className="text-sm text-muted-foreground">{product.region}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {product.artisanStory}
              </p>
              <Button variant="outline" className="w-full mt-4">
                Visit Artisan Profile
              </Button>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-8">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.relatedProducts.map((relatedProduct: any) => (
              <Link
                key={relatedProduct.id}
                href={`/buyer/product/${relatedProduct.id}`}
              >
                <Card className="overflow-hidden group cursor-pointer border-0 bg-muted/50 hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-sm line-clamp-2 mb-2">
                      {relatedProduct.name}
                    </p>
                    <p className="font-semibold text-lg">
                      ${relatedProduct.price}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
