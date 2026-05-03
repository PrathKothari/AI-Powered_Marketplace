'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'

const categories = [
  { id: 1, name: 'Jewelry', color: 'from-amber-100 to-orange-100' },
  { id: 2, name: 'Pottery', color: 'from-rose-100 to-pink-100' },
  { id: 3, name: 'Clothing', color: 'from-blue-100 to-cyan-100' },
  { id: 4, name: 'Paintings', color: 'from-purple-100 to-indigo-100' },
  { id: 5, name: 'Decor', color: 'from-green-100 to-emerald-100' },
  { id: 6, name: 'Crafts', color: 'from-yellow-100 to-lime-100' },
]

export default function CategoriesGrid() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Explore Categories</h2>
          <p className="text-muted-foreground text-lg">
            Browse through our curated collection of handmade masterpieces
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}
              className="group overflow-hidden h-48"
            >
              <Card className="cursor-pointer overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 h-full">
                <div className={`h-full flex items-center justify-center ${category.color} group-hover:scale-105 transition-transform duration-300`} style={{ backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0))' }}>
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">{category.name}</h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
