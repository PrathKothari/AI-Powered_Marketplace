import { Product } from '@/lib/types/product'

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Handwoven Basket',
    price: 45,
    description: 'A durable, handwoven basket made from natural fibers. Perfect for home storage and decor.',
    status: 'in-stock',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519682577862-22b622b21b14?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1521540216272-a50305cd4421?auto=format&fit=crop&w=1000&q=80',
    ],
    artisan: {
      name: 'Ana Flores',
      location: 'Oaxaca, Mexico',
      avatar: '/artisan-ana.jpg',
    },
    storyVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
    category: 'Home Decor',
    rating: 4.9,
    relatedProducts: ['2', '3'],
  },
  {
    id: '2',
    name: 'Ceramic Mug Set',
    price: 35,
    description: 'Set of two potter-crafted ceramic mugs with unique glazes and a cozy feel.',
    status: 'low-stock',
    images: [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1515573383160-0d4d30feb7c6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80',
    ],
    artisan: {
      name: 'Ravi Patel',
      location: 'Jaipur, India',
      avatar: '/artisan-ravi.jpg',
    },
    storyVideo: 'https://www.w3schools.com/html/movie.mp4',
    category: 'Kitchen',
    rating: 4.7,
    relatedProducts: ['1', '4'],
  },
  {
    id: '3',
    name: 'Leather Journal',
    price: 28,
    description: 'A handcrafted leather journal with premium paper, perfect for notes and ideas.',
    status: 'out-of-stock',
    images: [
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1516637090014-cb1ab78511f5?auto=format&fit=crop&w=1000&q=80',
    ],
    artisan: {
      name: 'Maya Singh',
      location: 'Jaipur, India',
      avatar: '/artisan-maya.jpg',
    },
    storyVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
    category: 'Stationery',
    rating: 4.8,
    relatedProducts: ['1', '2'],
  },
]
