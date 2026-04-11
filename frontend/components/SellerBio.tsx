'use client'

import { ReactNode, useEffect, useState } from 'react'
import { getUserProfile, type UserProfile } from '@/lib/api'
import { User, MapPin, Palette, Clock } from 'lucide-react'

interface SellerBioProps {
  userId: string
  userName?: string
  fallback?: ReactNode
}

export default function SellerBio({ userId, userName, fallback = null }: SellerBioProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoaded(true)
      return
    }
    getUserProfile(userId)
      .then(p => setProfile(p))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [userId])

  // While loading, render nothing to avoid flicker between fallback and real bio
  if (!loaded) return null

  // No bio set — render the fallback (basic artisan card) if provided
  if (!profile?.bio) return <>{fallback}</>

  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.name || ''} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
            {(profile.name || userName || '?').charAt(0)}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-foreground">{profile.name || userName}</h4>
          <p className="text-xs text-muted-foreground">About the Seller</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {profile.craftType && (
          <span className="flex items-center gap-1">
            <Palette className="w-3 h-3" /> {profile.craftType}
          </span>
        )}
        {profile.region && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {profile.region}
          </span>
        )}
        {profile.experienceYears && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {profile.experienceYears}+ years
          </span>
        )}
      </div>
    </div>
  )
}
