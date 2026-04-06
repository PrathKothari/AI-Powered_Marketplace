'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, Menu } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useTranslation } from '@/lib/i18n'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { t, lang, setLang } = useTranslation()

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Artisan</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              {t("marketplace")}
            </Link>
            <Link href="/reels" className="text-sm font-medium hover:text-primary transition-colors">
              Reels
            </Link>
            <Link href="/discover" className="text-sm font-medium hover:text-primary transition-colors">
              Discover
            </Link>
            <Link href="/origin" className="text-sm font-medium hover:text-primary transition-colors">
              Origin
            </Link>
          </div>

          {/* Search Bar */}
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

            <Link href="/buyer/cart" className="p-2 hover:bg-secondary rounded-lg transition-colors relative" id="cart-icon">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link href="/login" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/buyer/cart" className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[1.1rem] h-4.5 flex items-center justify-center rounded-full px-1">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
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
            <Link href="/" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              Home
            </Link>
            <Link href="/marketplace" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              {t("marketplace")}
            </Link>
            <Link href="/reels" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              Reels
            </Link>
            <Link href="/discover" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              Discover
            </Link>
            <Link href="/origin" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              Origin
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
            <Link href="/login" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-2">
              <User className="w-4 h-4" /> Profile / Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
