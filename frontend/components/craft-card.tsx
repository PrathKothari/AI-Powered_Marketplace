'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleFavorite } from '@/store/slices/userSlice'

interface CraftCardProps {
  id: string
  name: string
  artisanId: string
  artisanName: string
  image: string
  region: string
  price: number
}

export function CraftCard({
  id,
  name,
  artisanId,
  artisanName,
  image,
  region,
  price,
}: CraftCardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const favorites = useAppSelector((state) => state.user.favorites)
  const isFavorite = favorites.includes(id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(toggleFavorite(id))
  }

 const goToCraft = () => {
  router.push(`/buyer/product/${id}`)
}

  const goToArtisan = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/buyer/artisan/${artisanId}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToCraft}
      onKeyDown={(e) => e.key === 'Enter' && goToCraft()}
      className="group cursor-pointer rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted">
        <Image
          src={image || '/placeholder.svg'}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Story Verified */}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
          Story Verified
        </div>

        {/* Favorite */}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 left-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background"
        >
          <Heart
            size={20}
            className={
              isFavorite
                ? 'fill-destructive text-destructive'
                : 'text-card-foreground'
            }
          />
        </button>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/30 transition-all">
          <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg line-clamp-2">
          {name}
        </h3>

        <button
          onClick={goToArtisan}
          className="mt-1 text-primary hover:underline text-sm font-medium"
        >
          {artisanName}
        </button>

        <p className="text-muted-foreground text-sm mt-1">{region}</p>

        <p className="text-primary font-bold text-lg mt-3">
          ${price.toFixed(2)}
        </p>
      </div>
    </div>
  )
}