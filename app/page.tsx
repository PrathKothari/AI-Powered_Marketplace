import Link from "next/link"
import { ArrowRight, Palette, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f2] via-[#f5ede5] to-[#efe5da] flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[#e8ddd2] bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c97a4a] to-[#d4885a] flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#5a3a2a]">ArtisanAI</h1>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#" className="text-[#7d5a47] hover:text-[#c97a4a] transition-colors">
              About
            </a>
            <a href="#" className="text-[#7d5a47] hover:text-[#c97a4a] transition-colors">
              Impact
            </a>
            <a href="#" className="text-[#7d5a47] hover:text-[#c97a4a] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Decorative element */}
          <div className="inline-block mb-6">
            <span className="text-4xl">✨</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-6xl font-bold text-[#5a3a2a] mb-6 leading-tight text-pretty">
            Bringing Local Artisans to the Digital World
          </h2>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-[#7d5a47] mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
            Connect directly with creators using AI-powered storytelling and discovery. Celebrate authentic
            craftsmanship, preserve cultural heritage, and build meaningful relationships between artisans and buyers
            worldwide.
          </p>

          {/* CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-12">
            {/* Artisan Card */}
            <div className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#e8ddd2] hover:border-[#c97a4a]">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4885a] to-[#c97a4a] flex items-center justify-center">
                  <Palette className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#5a3a2a] mb-3">I am an Artisan</h3>

              <p className="text-[#7d5a47] mb-8 text-base md:text-lg leading-relaxed">
                Showcase your craft, tell your story, reach global buyers
              </p>

              <Link
                href="/artisian/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c97a4a] to-[#d4885a] text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg transition-all duration-300 group-hover:translate-x-1"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-[#a08073] mt-6 pt-6 border-t border-[#e8ddd2]">
                Free to list • Keep 90% of earnings • Support from community
              </p>
            </div>

            {/* Buyer Card */}
            <div className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#e8ddd2] hover:border-[#d6a574]">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d6a574] to-[#c4934f] flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#5a3a2a] mb-3">I am a Buyer</h3>

              <p className="text-[#7d5a47] mb-8 text-base md:text-lg leading-relaxed">
                Discover authentic handmade products and the stories behind them
              </p>

              <Link
                href="/buyer/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d6a574] to-[#c4934f] text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg transition-all duration-300 group-hover:translate-x-1"
              >
                Explore Crafts
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-[#a08073] mt-6 pt-6 border-t border-[#e8ddd2]">
                Ethically sourced • Fair trade guaranteed • Direct from makers
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-[#7d5a47] text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c97a4a]"></div>
              <span>AI-Powered Discovery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c97a4a]"></div>
              <span>100% Authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c97a4a]"></div>
              <span>Fair Trade Certified</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8ddd2] bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-[#7d5a47] text-sm">
            Preserving cultural heritage, one handmade craft at a time. Supporting fair trade and sustainable
            livelihoods for artisans worldwide.
          </p>
          <p className="text-[#a08073] text-xs mt-4">
            © 2026 ArtisanAI. All artisans retain intellectual property rights to their original designs.
          </p>
        </div>
      </footer>
    </div>
  )
}
