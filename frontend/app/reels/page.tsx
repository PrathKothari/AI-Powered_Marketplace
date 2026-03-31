'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart, UserPlus, Sparkles, ExternalLink } from 'lucide-react'

// Mock Data from prompt
const MOCK_REELS = [
  {
    id: 1,
    video: "/videos/basket.mp4", // Note: Ensure this file exists in your public/videos folder. 
    // Fallback included if needed down the line: "https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4"
    productId: 1,
    title: "Handwoven Basket",
    artisan: "Ravi Kumar",
    location: "Kutch, India",
    caption: "Watch how I weave this traditional basket using locally sourced bamboo. Each piece takes up to 4 days to perfect!"
  },
  {
    id: 2,
    video: "https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4", // Second reel for scroll testing
    productId: 2,
    title: "Ceramic Glazing Process",
    artisan: "Meera Patel",
    location: "Jaipur, India",
    caption: "The final glazing is my favorite part of the pottery making process! Adding the final seal of authenticity."
  }
]

export default function ReelsPage() {
  const router = useRouter()
  const [likedReels, setLikedReels] = useState<Set<number>>(new Set())
  const [followedArtisans, setFollowedArtisans] = useState<Set<string>>(new Set())

  // Handle Video auto-playing via Intersection Observer so only the viewed video plays
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
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
      { threshold: 0.6 } // Video plays when 60% visible
    )

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video)
    })

    return () => observer.disconnect()
  }, [])

  const toggleLike = (id: number) => {
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

  return (
    <main className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {MOCK_REELS.map((reel, index) => {
        const isLiked = likedReels.has(reel.id)
        const isFollowed = followedArtisans.has(reel.artisan)

        return (
          <article key={reel.id} className="relative h-screen w-full snap-start bg-black flex justify-center">
            
            {/* Centered Video Player */}
            <div className="relative h-full w-full max-w-lg aspect-[9/16] bg-slate-900 overflow-hidden mx-auto shadow-2xl">
              <video
                ref={(el) => { videoRefs.current[index] = el; }} // Note: We do not return the assignment in a way that tricks TS into failing
                src={reel.video}
                muted // Must be muted by default for auto-play across strict browsers
                loop
                playsInline
                className="w-full h-full object-cover"
              />

               {/* AI Generated Badge (Bonus) */}
              <div className="absolute top-6 left-4 z-20">
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
                    {/* Placeholder Avatar */}
                    {reel.artisan.charAt(0)}
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

              {/* Right Side CTA Buttons (Instagram Style) */}
              <div className="absolute bottom-8 right-3 flex flex-col items-center gap-6 z-20 pointer-events-auto">
                <button title="Like" onClick={() => toggleLike(reel.id)} className="group flex flex-col items-center gap-1 focus:outline-none hover:scale-110 transition-transform">
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
