'use client'

import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setRole } from "@/store/slices/userSlice"


import { ArrowRight, Palette, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch()

  const handleArtisan = () => {
    dispatch(setRole('artisan'))
    router.push('/artisian/login')
  }

  const handleBuyer = () => {
    dispatch(setRole('buyer'))
    router.push('/buyer/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f2] via-[#f5ede5] to-[#efe5da] flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[#e8ddd2] bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c97a4a] to-[#d4885a] flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#5a3a2a]">ArtisanAI</h1>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-[#5a3a2a] mb-6">
            Bringing Local Artisans to the Digital World
          </h2>

          <p className="text-lg text-[#7d5a47] mb-12 max-w-2xl mx-auto">
            Connect directly with creators. Celebrate authentic craftsmanship.
          </p>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Artisan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e8ddd2]">
              <div className="flex justify-center mb-6">
                <Palette className="w-10 h-10 text-[#c97a4a]" />
              </div>

              <h3 className="text-2xl font-bold text-[#5a3a2a] mb-4">
                I am an Artisan
              </h3>

              <p className="text-[#7d5a47] mb-6">
                Showcase your craft and reach global buyers
              </p>

              <Button
                onClick={handleArtisan}
                className="w-full bg-gradient-to-r from-[#c97a4a] to-[#d4885a]"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {/* Buyer */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e8ddd2]">
              <div className="flex justify-center mb-6">
                <Users className="w-10 h-10 text-[#c4934f]" />
              </div>

              <h3 className="text-2xl font-bold text-[#5a3a2a] mb-4">
                I am a Buyer
              </h3>

              <p className="text-[#7d5a47] mb-6">
                Discover authentic handmade products
              </p>

              <Button
                variant="outline"
                onClick={handleBuyer}
                className="w-full border-[#c4934f] text-[#c4934f]"
              >
                Explore Crafts
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
