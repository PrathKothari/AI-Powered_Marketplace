'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart, UserPlus, Sparkles, ExternalLink, Film, ArrowLeft } from 'lucide-react'
import { getCatalogProducts } from '@/lib/api'

interface Reel {
  productId: string
  video: string
  title: string
  artisan: string
  location: string
  caption: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1').replace(/\/api\/v1$/, '')

// Normalize story video URL (handle relative /media/ paths from the backend)
const resolveVideoUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}

export default function ReelsPage() {
  const router = useRouter()
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set())
  const [followedArtisans, setFollowedArtisans] = useState<Set<string>>(new Set())

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Fetch products with real story videos from the catalog.
  // Exclude stale/mock URLs (blob: URLs, external placeholders).
  useEffect(() => {
    getCatalogProducts()
      .then((products) => {
        const isRealVideo = (url: string) =>
          !!url &&
          url.trim().length > 0 &&
          !url.startsWith('blob:') &&
          !url.includes('w3schools.com') &&
          !url.includes('pexels.com')

        const reelsFromProducts: Reel[] = products
          .filter((p: any) => isRealVideo(p.storyVideo))
          .map((p: any) => ({
            productId: p.productId || p.id,
            video: resolveVideoUrl(p.storyVideo),
            title: p.title || 'Untitled Painting',
            artisan: p.artisanName || p.artisanId || 'Unknown Artisan',
            location: p.region || 'India',
            caption: p.description || 'A unique handcrafted piece',
          }))
        setReels(reelsFromProducts)
      })
      .catch((err) => {
        console.error('Failed to fetch reels:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Auto-play the visible reel via Intersection Observer
  useEffect(() => {
    if (reels.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(e => console.log('Autoplay blocked', e))
          } else {
            video.pause()
            video.currentTime = 0
          }
        })
      },
      { threshold: 0.6 }
    )

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video)
    })

    return () => observer.disconnect()
  }, [reels])

  const toggleLike = (id: string) => {
    setLikedReels(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFollow = (artisan: string) => {
    setFollowedArtisans(prev => {
      const next = new Set(prev)
      if (next.has(artisan)) next.delete(artisan)
      else next.add(artisan)
      return next
    })
  }

  if (loading) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </main>
    )
  }

  if (reels.length === 0) {
    return (
      <main className="h-screen w-full bg-black flex flex-col items-center justify-center text-white gap-4 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <Film className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-2xl font-bold">No reels yet</h2>
        <p className="text-white/60 text-sm max-w-md">
          When artisans list products, AI-generated reels appear here. Be the first to showcase your craft!
        </p>
        <button
          onClick={() => router.push('/sell')}
          className="mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-105 transition-transform"
        >
          List a Painting
        </button>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth relative">
      <div className="fixed top-6 left-4 z-50 md:left-8">
        <button
          onClick={() => router.push('/marketplace')}
          className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/20 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Back to Marketplace"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>
      {reels.map((reel, index) => {
        const isLiked = likedReels.has(reel.productId)
        const isFollowed = followedArtisans.has(reel.artisan)

        return (
          <article key={reel.productId} className="relative h-screen w-full snap-start bg-black flex justify-center">

            {/* Centered Video Player */}
            <div className="relative h-full w-full max-w-lg aspect-[9/16] bg-slate-900 overflow-hidden mx-auto shadow-2xl">
              <video
                ref={(el) => { videoRefs.current[index] = el }}
                src={reel.video}
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute top-6 left-4 z-20 md:left-auto md:right-4">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Story generated with AI</span>
                </div>
              </div>

              {/* Bottom Gradient Fade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              {/* Main Content Overlay */}
              <div className="absolute bottom-0 left-0 right-16 p-6 text-white pb-8 z-10 pointer-events-none">

                {/* Artisan Details */}
                <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-lg border-2 border-white shadow-lg overflow-hidden">
                    {reel.artisan.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight drop-shadow-md flex items-center gap-2">
                      {reel.artisan}
                      <button
                        onClick={() => toggleFollow(reel.artisan)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${isFollowed ? 'border-white/20 bg-white/10 text-white' : 'border-white bg-white text-black font-semibold hover:bg-white/90'}`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                    </h3>
                    <p className="text-xs text-white/80 drop-shadow-md">📍 {reel.location}</p>
                  </div>
                </div>

                {/* Caption & Title */}
                <div className="pointer-events-auto">
                  <h2 className="text-xl font-bold mb-1 drop-shadow-lg">{reel.title}</h2>
                  <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md font-light leading-relaxed">
                    {reel.caption}
                  </p>
                </div>
              </div>

              {/* Right Side CTA Buttons */}
              <div className="absolute bottom-8 right-3 flex flex-col items-center gap-6 z-20 pointer-events-auto">
                <button title="Like" onClick={() => toggleLike(reel.productId)} className="group flex flex-col items-center gap-1 focus:outline-none hover:scale-110 transition-transform">
                  <div className={`p-2.5 rounded-full backdrop-blur-md ${isLiked ? 'bg-red-500/20' : 'bg-black/40'} border border-white/10 shadow-lg`}>
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'} transition-colors`} />
                  </div>
                  <span className="text-xs text-white font-medium drop-shadow-md">Like</span>
                </button>

                <button title="Buy Now" onClick={() => router.push(`/product/${reel.productId}?action=buy`)} className="group flex flex-col items-center gap-1 focus:outline-none hover:scale-110 transition-transform">
                  <div className="p-2.5 rounded-full bg-primary/90 backdrop-blur-md border border-white/20 shadow-lg hover:bg-primary transition-colors">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-white font-medium drop-shadow-md">Buy</span>
                </button>

                <button title="View Product" onClick={() => router.push(`/product/${reel.productId}`)} className="group flex flex-col items-center gap-1 focus:outline-none hover:scale-110 transition-transform">
                  <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/20 transition-colors">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-white font-medium drop-shadow-md">Visit</span>
                </button>
              </div>

            </div>
          </article>
        )
      })}
    </main>
  )
}
