// UNUSED - safe to delete (replaced by components/buyer/story-reels.tsx; no imports found)
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export type StoryReelProps = {
  videoUrl?: string
  artisan?: {
    name: string
    location: string
    avatar?: string
  }
  onShopThisCraft?: () => void
}

export default function StoryReel({ videoUrl, artisan, onShopThisCraft }: StoryReelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseEnter = () => {
    setIsHovering(true)
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-serif font-bold">Craft Story</h2>
        <p className="text-sm text-muted-foreground">Watch how this product is made</p>
      </div>

      <div
        className="mb-4 overflow-hidden rounded-xl bg-muted shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto max-h-96 object-cover"
            controls
            playsInline
            onLoadedData={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center h-60 text-center text-muted-foreground">
            Story not available
          </div>
        )}

        {isLoading && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
            Loading story...
          </div>
        )}
      </div>

      {artisan ? (
        <div className="mb-4 rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          {artisan.avatar ? (
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
              <Image src={artisan.avatar} alt={artisan.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-sm text-primary">
              {artisan.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{artisan.name}</p>
            <p className="text-sm text-muted-foreground">{artisan.location}</p>
          </div>
        </div>
      ) : null}

      <Button onClick={onShopThisCraft} className="w-full md:w-auto">
        Shop this craft
      </Button>
    </section>
  )
}
