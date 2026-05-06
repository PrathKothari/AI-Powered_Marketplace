import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Discover Unique Handmade Products
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Support talented artisans and find one-of-a-kind handcrafted items. Every purchase directly supports small businesses and creative makers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-outfit font-bold uppercase tracking-wider group text-sm transition-all hover:scale-105 active:scale-95"
                >
                  Explore Products
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-white rounded-lg font-outfit font-bold uppercase tracking-wider text-sm transition-all hover:scale-105 active:scale-95"
              >
                Share Your Art
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-96 md:h-full min-h-96">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/ai-market-asst-1.firebasestorage.app/o/dataset%2Fmadhubani%2Fmadhubani0.jpg?alt=media&token=770c03a1-9df2-43a8-a9c7-addb89ca132a"
              alt="Hand-painted Madhubani Masterpiece"
              fill
              className="object-cover rounded-xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
