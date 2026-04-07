import { Product } from '@/lib/types/product'
import { PRODUCTS } from '@/lib/mock-data/products'

export function getProducts(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem('products')
    if (!data) {
      // Auto seed if empty
      localStorage.setItem('products', JSON.stringify(PRODUCTS))
      return PRODUCTS
    }
    return JSON.parse(data)
  } catch (e) {
    return PRODUCTS
  }
}

export function addProduct(product: any): void {
  const products = getProducts()
  
  // Format into expected standard mock shape if loose
  const formattedProduct: Product = {
    ...product,
    id: product.id || String(Date.now()),
    name: product.name,
    title: product.name, // Support older grid fallbacks if any
    price: parseFloat(product.price) || 0,
    description: product.description || 'A beautiful handcrafted item.',
    images: product.images ? product.images.split(',').map((u:string) => u.trim()) : ['https://via.placeholder.com/300'],
    category: product.category || 'Craft',
    rating: 0,
    sales: 0,
    status: 'in-stock',
    artisan: {
      name: 'Sofia (Local Maker)',
      location: product.origin || 'Local Workshop',
      image: 'https://api.dicebear.com/7.x/notionists/svg?seed=sofia'
    },
    storyVideo: product.storyVideo || ''
  }

  products.push(formattedProduct)
  localStorage.setItem('products', JSON.stringify(products))
}
