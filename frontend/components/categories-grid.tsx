'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/api'

interface Category {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  gradientTheme?: string;
}

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Explore Categories</h2>
          <p className="text-muted-foreground text-lg">
            Browse through our curated collection of handmade masterpieces
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="h-48 bg-slate-100 animate-pulse border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.categoryId}
                href={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}
              >
                <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 h-48 relative">
                  <Image
                    src={category.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/ai-market-asst-1.firebasestorage.app/o/dataset%2Fmadhubani%2Fmadhubani0.jpg?alt=media&token=770c03a1-9df2-43a8-a9c7-addb89ca132a'}
                    alt={category.name}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-60 transition-opacity duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-[0.2em] drop-shadow-xl z-20 group-hover:scale-110 transition-transform duration-500">
                      {category.name}
                    </h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
