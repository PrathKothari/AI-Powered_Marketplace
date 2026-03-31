'use client'

import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setRole } from "@/store/slices/userSlice"

import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import CategoriesGrid from "@/components/categories-grid"
import ProductsGrid from "@/components/products-grid"
import WhyChooseUs from "@/components/why-choose-us"
import SellerCTA from "@/components/seller-cta"
import Footer from "@/components/footer"

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch()

  return (
    <div className="min-h-screen bg-background">

      <Navbar />

      <main>
        <HeroSection />

        {/* 🔥 Unified Logic */}
        <div className="flex justify-center gap-6 py-10">
          <button
            onClick={() => router.push('/marketplace')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Explore Marketplace
          </button>

          <button
            onClick={() => router.push('/register?role=artisan')}
            className="border px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Start Selling
          </button>

          <button
            onClick={() => router.push('/login')}
            className="border px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Login
          </button>
        </div>

        <CategoriesGrid />
        <ProductsGrid />
        <WhyChooseUs />
        <SellerCTA />
      </main>

      <Footer />
    </div>
  )
}