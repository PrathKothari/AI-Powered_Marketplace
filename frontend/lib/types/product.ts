export type Product = {
  id: string
  name: string
  price: number
  images: string[]
  description: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  artisan: {
    name: string
    location: string
    avatar?: string
  }
  storyVideo?: string
  category?: string
  rating?: number
  relatedProducts?: string[]
  sold?: number
  stock?: number
}
