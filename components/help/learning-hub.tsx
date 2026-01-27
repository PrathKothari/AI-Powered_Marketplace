'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

const guides = [
  {
    id: 'photography',
    title: 'How to photograph your craft',
    description: 'Master lighting, composition, and styling to showcase your work beautifully.',
    icon: '📸',
  },
  {
    id: 'pricing',
    title: 'Pricing your handmade products',
    description: 'Learn strategies to price fairly while reflecting your artistry and effort.',
    icon: '💰',
  },
  {
    id: 'storytelling',
    title: 'Telling your story in your own voice',
    description: 'Connect with customers through authentic, compelling storytelling.',
    icon: '📖',
  },
  {
    id: 'packaging',
    title: 'Packaging & shipping best practices',
    description: 'Create delightful unboxing experiences and ship products safely.',
    icon: '📦',
  },
  {
    id: 'repeat-buyers',
    title: 'How to attract repeat buyers',
    description: 'Build loyalty and create a community around your craft.',
    icon: '💝',
  },
  {
    id: 'visibility',
    title: 'Boost your visibility and reach',
    description: 'Learn techniques to get your work discovered by more customers.',
    icon: '🌟',
  },
]

interface LearningHubProps {
  onSelectGuide: (id: string) => void
}

export default function LearningHub({ onSelectGuide }: LearningHubProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold text-foreground">Learning Hub</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <Card
            key={guide.id}
            className="p-6 hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/40 hover:bg-card/80"
            onClick={() => onSelectGuide(guide.id)}
          >
            <div className="text-4xl mb-3">{guide.icon}</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{guide.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{guide.description}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary hover:bg-primary/5 bg-transparent"
            >
              Learn More
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}
