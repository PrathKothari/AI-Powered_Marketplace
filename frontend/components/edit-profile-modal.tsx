'use client'

import React from "react"

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EditProfileModalProps {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: 'Priya Sharma',
    craftType: 'Terracotta Potter',
    location: 'Jaipur, India',
    bio: 'I create handcrafted terracotta pottery that celebrates traditional Indian craftsmanship.',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Profile updated:', formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Artisan Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-foreground focus:outline-none transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
            />
          </div>

          {/* Craft Type */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Craft Type
            </label>
            <input
              type="text"
              name="craftType"
              value={formData.craftType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-foreground focus:outline-none transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-foreground focus:outline-none transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              About You
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg text-foreground focus:outline-none transition-colors resize-none"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

