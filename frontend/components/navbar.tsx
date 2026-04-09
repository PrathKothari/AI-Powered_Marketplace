'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu, Paintbrush, LogOut, ChevronDown, LayoutDashboard, Plus, Package } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { t, lang, setLang } = useTranslation()
  const { user, logout } = useAuth()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    router.push('/')
    setUserMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">KalaSetu</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/marketplace" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              {t("marketplace")}
            </Link>
            <Link href="/reels" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Reels
            </Link>
            <Link href="/discover" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Discover
            </Link>
            <Link href="/origin" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Origin
            </Link>
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

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium hidden lg:block max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/orders" className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link href="/sell" className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Plus className="w-4 h-4" /> Sell a Painting
                    </Link>
                    <div className="border-t border-border mt-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
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
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors py-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({user.name})
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-2">
                <User className="w-4 h-4" /> Sign In / Register
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
