'use client'

import { useRouter } from 'next/navigation'
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import CategoriesGrid from "@/components/categories-grid"
import ProductsGrid from "@/components/products-grid"
import WhyChooseUs from "@/components/why-choose-us"
import SellerCTA from "@/components/seller-cta"
import Footer from "@/components/footer"

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">

      <Navbar />

      <main>
        <HeroSection />

        <CategoriesGrid />
        <ProductsGrid />
        <WhyChooseUs />
        <SellerCTA />
      </main>

      <Footer />
    </div>
  )
}