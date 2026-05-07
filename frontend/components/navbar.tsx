'use client'

import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User as UserIcon, Search, Menu, X, Globe } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useTranslation } from '@/lib/i18n'
import { getUser, User } from '@/lib/auth'
import { getProducts } from '@/lib/products'
import { Product } from '@/lib/types/product'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/marketplace', label: 'Marketplace', i18nKey: 'marketplace' },
  { href: '/reels', label: 'Reels' },
  { href: '/discover', label: 'Discover' },
  { href: '/origin', label: 'Origin' },
]
import { ShoppingCart, User, Menu, Paintbrush, LogOut, ChevronDown, LayoutDashboard, Plus, Package, UserCircle, Radio } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/context/AuthContext'
import { getUserProfile } from '@/lib/api'
import { toast } from 'sonner'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches] = useState(['Ceramic', 'Ring', 'Handwoven'])
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const router = useRouter()
  const { totalItems } = useCart()
  const { t, lang, setLang } = useTranslation()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Handle Search logic
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    // Simulate API delay
    const timer = setTimeout(() => {
      const products = getProducts()
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
      setIsSearching(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [debouncedSearch])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const { totalItems } = useCart()
  const { t, lang, setLang } = useTranslation()
  const { user, logout } = useAuth()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch profile photo
  useEffect(() => {
    if (!user) { setPhotoUrl(null); return }
    getUserProfile(user.uid).then(p => setPhotoUrl(p?.photoUrl || null)).catch(() => {})
  }, [user])

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCurrentUser(getUser())
  }, [])

  // Scroll-aware shadow & backdrop
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const profileHref = currentUser ? '/dashboard' : '/login'
  const profileLabel = currentUser ? 'Dashboard' : 'Login'

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }, [pathname])

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="search-highlight">{part}</span> 
            : part
        )}
      </>
    )
  }

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery('')
    setShowSuggestions(false)
    router.push(`/product/${product.id}`)
  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    router.push('/')
    setUserMenuOpen(false)
  }

  return (
    <>
      {/* Spacer for fixed navbar */}
      <div className="navbar-spacer" />
      <nav
        className={`navbar-root ${scrolled ? 'navbar-scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo group" aria-label="Home">
            <span className="navbar-logo-icon">A</span>
            <span className="navbar-logo-text">KalaSetu</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link ${isActive(link.href) ? 'navbar-link-active' : ''}`}
              >
                {link.i18nKey ? t(link.i18nKey) : link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="navbar-search-wrapper" ref={searchContainerRef}>
            <div className={`navbar-search ${searchFocused ? 'navbar-search-focused' : ''}`}>
              {isSearching ? <Loader2 className="navbar-search-icon animate-spin" /> : <Search className="navbar-search-icon" />}
              <input
                type="text"
                placeholder="Search products..."
                className="navbar-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  setSearchFocused(true)
                  setShowSuggestions(true)
                }}
                onBlur={() => setSearchFocused(false)}
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (searchQuery.length > 0 || searchFocused) && (
              <div className="search-dropdown">
                {searchQuery.length > 0 ? (
                  <div className="py-2">
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Finding treasures...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <>
                        <div className="px-4 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30">Products</div>
                        {suggestions.map((p) => (
                          <div 
                            key={p.id} 
                            className="search-suggestion-item"
                            onMouseDown={() => handleSuggestionClick(p)}
                          >
                            <img src={p.images?.[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                            <div className="flex-1 truncate">
                              <div className="text-sm font-semibold truncate">{highlightText(p.name, searchQuery)}</div>
                              <div className="text-xs text-muted-foreground">${p.price}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="search-no-results">
                        <div className="text-2xl">✨</div>
                        <div className="text-sm font-semibold">No treasures found for "{searchQuery}"</div>
                        <div className="text-xs text-muted-foreground">Try searching for ceramics, rings, or baskets instead.</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="px-4 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30">Trending Searches</div>
                    {recentSearches.map((s) => (
                      <div 
                        key={s} 
                        className="px-4 py-2.5 text-sm hover:bg-accent cursor-pointer flex items-center gap-3 transition-colors"
                        onMouseDown={() => setSearchQuery(s)}
                      >
                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
            <Link href="/live" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Live
            </Link>
            <Link href="/origin" className="text-sm font-outfit font-bold uppercase tracking-wider hover:text-primary transition-colors">
              Origin
            </Link>
          </div>



          {/* Desktop Actions */}
          <div className="navbar-actions">
            {/* Language Selector */}
            <button
              className="navbar-action-btn navbar-lang-btn"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              title={lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Globe className="w-[18px] h-[18px]" />
              <span className="navbar-lang-label">{lang === 'en' ? 'EN' : 'हि'}</span>
            </button>

            {/* Cart */}
            <Link href="/buyer/cart" className="navbar-action-btn" id="cart-icon" aria-label={`Cart with ${totalItems} items`}>
              <ShoppingCart className="w-[18px] h-[18px]" />
              {totalItems > 0 && (
                <span className="navbar-cart-badge">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href={profileHref}
              className="navbar-action-btn"
              title={profileLabel}
              aria-label={profileLabel}
            >
              <UserIcon className="w-[18px] h-[18px]" />
            </Link>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase">
                      {user.name.charAt(0)}
                    </div>
                  )}
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
                    <Link href="/profile" className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <UserCircle className="w-4 h-4" /> My Profile
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

          {/* Mobile: Cart + Hamburger */}
          <div className="navbar-mobile-actions">
            <Link href="/buyer/cart" className="navbar-action-btn" aria-label={`Cart with ${totalItems} items`}>
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="navbar-cart-badge">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <button
              className="navbar-hamburger"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <div className="navbar-hamburger-bars">
                <span className={`navbar-bar ${mobileMenuOpen ? 'navbar-bar-1-open' : ''}`} />
                <span className={`navbar-bar ${mobileMenuOpen ? 'navbar-bar-2-open' : ''}`} />
                <span className={`navbar-bar ${mobileMenuOpen ? 'navbar-bar-3-open' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`navbar-mobile-overlay ${mobileMenuOpen ? 'navbar-mobile-overlay-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        ref={mobileMenuRef}
        className={`navbar-mobile-panel ${mobileMenuOpen ? 'navbar-mobile-panel-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Mobile Search */}
        <div className="navbar-mobile-search-wrapper" ref={searchContainerRef}>
          <div className="navbar-search navbar-mobile-search">
            {isSearching ? <Loader2 className="navbar-search-icon animate-spin" /> : <Search className="navbar-search-icon" />}
            <input
              type="text"
              placeholder="Search products..."
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>
          
          {/* Mobile Search Suggestions Dropdown */}
          {showSuggestions && (searchQuery.length > 0 || searchFocused) && (
            <div className="search-dropdown static mt-2 max-h-[60vh] overflow-y-auto">
              {searchQuery.length > 0 ? (
                <div className="py-2">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Finding treasures...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30">Products</div>
                      {suggestions.map((p) => (
                        <div 
                          key={p.id} 
                          className="search-suggestion-item"
                          onMouseDown={() => {
                            handleSuggestionClick(p)
                            setMobileMenuOpen(false)
                          }}
                        >
                          <img src={p.images?.[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="flex-1 truncate">
                            <div className="text-sm font-semibold truncate">{highlightText(p.name, searchQuery)}</div>
                            <div className="text-xs text-muted-foreground">${p.price}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="search-no-results">
                      <div className="text-sm font-semibold">No treasures found for "{searchQuery}"</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30">Trending Searches</div>
                  {recentSearches.map((s) => (
                    <div 
                      key={s} 
                      className="px-4 py-2.5 text-sm hover:bg-accent cursor-pointer flex items-center gap-3 transition-colors"
                      onMouseDown={() => setSearchQuery(s)}
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Links */}
        <div className="navbar-mobile-links">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-mobile-link ${isActive(link.href) ? 'navbar-mobile-link-active' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{link.i18nKey ? t(link.i18nKey) : link.label}</span>
              {isActive(link.href) && <span className="navbar-mobile-link-dot" />}
            </Link>
          ))}
        </div>

        {/* Mobile Footer Actions */}
        <div className="navbar-mobile-footer">
          <button
            className="navbar-mobile-footer-btn"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          >
            <Globe className="w-5 h-5" />
            <span>{lang === 'en' ? 'English' : 'हिंदी'}</span>
          </button>
          <Link
            href={profileHref}
            className="navbar-mobile-footer-btn navbar-mobile-profile-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserIcon className="w-5 h-5" />
            <span>{profileLabel}</span>
          </Link>
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
            <Link href="/live" className="block text-sm font-medium hover:text-primary transition-colors py-2">
              Live
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
    </>
  )
}
