'use client'

import React from "react"

import { useState } from 'react'
import { Star, MapPin, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ProfileHeaderProps {
  onEdit: () => void
}

export default function ProfileHeader({ onEdit }: ProfileHeaderProps) {
  const [imageUrl, setImageUrl] = useState('/api/placeholder/120/120')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center flex-1">
            {/* Profile Image */}
            <div className="relative">
              <label className="cursor-pointer group">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Artisan Profile"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-md group-hover:shadow-lg transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                    Upload
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Priya Sharma
              </h1>
              <p className="text-lg font-semibold mb-3" style={{ color: 'var(--primary)' }}>
                Terracotta Potter
              </p>

              <div className="flex flex-col gap-2 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>Jaipur, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                    <span className="font-semibold text-foreground">4.6</span>
                    <span>from 128 buyers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              onClick={onEdit}
              className="w-full md:w-auto"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-auto bg-transparent"
              style={{
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
              }}
            >
              <Eye size={16} className="mr-2" />
              View Public Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
