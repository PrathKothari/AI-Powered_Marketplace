import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function SellerCta() {
  return (
    <section className="py-20 md:py-28 bg-primary/90 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mb-36" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Ready to Share Your Craft?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of artisans selling their handmade creations. Set your own prices, reach customers worldwide, and grow your creative business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-white/90 text-primary rounded-lg font-semibold group"
            >
              <Link href="/register?role=artisan" className="inline-flex items-center gap-2">
                Start Selling Your Craft
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 rounded-lg font-semibold"
            >
              <Link href="/marketplace">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
