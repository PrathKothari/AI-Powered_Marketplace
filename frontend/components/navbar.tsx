'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { getCart } from '@/lib/cart'
import { useTranslation } from '@/lib/i18n'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { t, lang, setLang } = useTranslation()

  // Listen globally to the "cartUpdated" event dispatched exactly by our lib/cart.ts overrides
  useEffect(() => {
    // Initial fetch
    setCartCount(getCart().reduce((acc, item) => acc + item.quantity, 0))

    const handleCartUpdate = () => {
      setCartCount(getCart().reduce((acc, item) => acc + item.quantity, 0))
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="">
            <h1 className="text-2xl font-bold text-primary">Artisan</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/marketplace" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("marketplace")}
            </Link>
            <Link href="/reels" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Reels
            </Link>
            <Link href="/discover" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Discover
            </Link>
            <Link href="/origin" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Origin
            </Link>
            <Link href="/cart" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("cart")}
            </Link>
          </div>

          {/* Search Bar (Hidden on mobile) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
            </select>
            <Link href="/cart" className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/login" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <User className="w-5 h-5 text-foreground" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Link href="/" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Home
            </Link>
            <Link href="/marketplace" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              {t("marketplace")}
            </Link>
            <Link href="/reels" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Reels
            </Link>
            <Link href="/discover" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Discover
            </Link>
            <Link href="/origin" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Origin
            </Link>
            <Link href="/cart" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              {t("cart")}
            </Link>
            <div className="py-2">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>
            <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              <User className="w-4 h-4" /> Profile / Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
