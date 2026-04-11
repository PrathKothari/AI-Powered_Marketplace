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
import RecommendationsSection from "@/components/RecommendationsSection"

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch()

  return (
    <div className="min-h-screen bg-background">

      <Navbar />

      <main>
        <HeroSection />


        <CategoriesGrid />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <RecommendationsSection
            title="Recommended for you"
            subtitle="AI-curated picks based on what's in your cart and what's trending"
          />
        </div>

        <WhyChooseUs />
        <SellerCTA />
      </main>

      <Footer />
    </div>
  )
}