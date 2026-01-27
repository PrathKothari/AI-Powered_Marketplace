'use client'

import { useState } from 'react'
import { Edit2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AboutSection() {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(
    'I create handcrafted terracotta pottery that celebrates traditional Indian craftsmanship. Each piece is shaped by hand and fired in traditional kilns, bringing warmth and authenticity to your home.'
  )

  const storyText =
    'I discovered my passion for pottery during my grandmother\'s ceramics classes. Growing up, I was fascinated by how clay could be transformed into beautiful functional art. After years of experimenting with different techniques and glazes, I launched my small studio to share the joy of handmade pottery with the world.'

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">About the Artisan</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            style={{ color: 'var(--primary)' }}
          >
            <Edit2 size={16} className="mr-2" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4 text-foreground resize-none focus:outline-none"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--background)',
            }}
            rows={4}
          />
        ) : (
          <p className="text-muted-foreground leading-relaxed mb-6">{bio}</p>
        )}
      </Card>

      {/* Story Section */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow p-6 md:p-8">
        <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Why I Craft</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">{storyText}</p>
        <Button
          variant="outline"
          style={{
            borderColor: 'var(--primary)',
            color: 'var(--primary)',
          }}
        >
          Edit Story
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </Card>
    </div>
  )
}
