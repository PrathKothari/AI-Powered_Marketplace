"use client"

import { MapPin, Star, Eye } from "lucide-react"
import { useAppSelector } from '@/store/hooks'

import type { RootState } from "@/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ProfileHeaderProps {
  onEdit: () => void
}

export default function ProfileHeader({ onEdit }: ProfileHeaderProps) {
  const {
    fullName,
    craftType,
    village,
    state,
  } = useAppSelector((state: RootState) => state.onboarding)

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="px-6 py-8 bg-muted/30">
        <div className="flex justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">
              {fullName || "Artisan"}
            </h1>

            <p className="text-lg font-semibold text-primary">
              {craftType || "Craft Artist"}
            </p>

            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin size={16} />
              <span>
                {village || "Village"}, {state || "India"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Star className="text-amber-500 fill-amber-500" size={16} />
              <span className="font-semibold">4.6</span>
              <span className="text-muted-foreground">from buyers</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={onEdit}>Edit Profile</Button>
            <Button variant="outline">
              <Eye size={16} className="mr-2" />
              View Public Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
