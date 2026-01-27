'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Bookmark, CheckCircle } from 'lucide-react'

const guideContent: Record<string, { title: string; icon: string; tips: string[] }> = {
  photography: {
    title: 'How to photograph your craft',
    icon: '📸',
    tips: [
      'Use natural light when possible - it makes your work look authentic and inviting.',
      'Shoot during golden hour (early morning or late afternoon) for warm, flattering light.',
      'Set up a simple backdrop using neutral fabrics or painted walls.',
      'Use a tripod to keep shots stable and consistent across your collection.',
      'Take photos from multiple angles - front, side, and detail shots.',
      'Include lifestyle shots showing your product in use.',
      'Edit consistently - develop a signature look for your brand.',
      'Keep props minimal to avoid distracting from your actual craft.',
    ],
  },
  pricing: {
    title: 'Pricing your handmade products',
    icon: '💰',
    tips: [
      'Calculate your material costs - know the exact expense of each item.',
      'Factor in time - estimate hours spent and assign a reasonable hourly rate.',
      'Research competitors - see what similar artisans charge, then position yourself.',
      'Consider overhead - account for tools, workspace, packaging, and shipping.',
      'Add profit margin - aim for at least 50% margin to sustain your business.',
      'Test and adjust - start with your estimated price and gather customer feedback.',
      'Communicate value - explain in your listing why your price reflects quality.',
      'Offer tiered pricing - consider different package options for different budgets.',
    ],
  },
  storytelling: {
    title: 'Telling your story in your own voice',
    icon: '📖',
    tips: [
      'Be authentic - share your genuine journey and passion for your craft.',
      'Use conversational language - write like you\'re talking to a friend.',
      'Explain your "why" - help customers understand what drives you.',
      'Share your process - people love learning how something is made.',
      'Include personal touches - mention your inspirations and background.',
      'Be vulnerable - it\'s okay to show your growth and learning journey.',
      'Keep it concise - aim for 2-3 paragraphs that capture attention.',
      'Update regularly - let customers see your evolution as an artisan.',
    ],
  },
  packaging: {
    title: 'Packaging & shipping best practices',
    icon: '📦',
    tips: [
      'Choose protective materials - use bubble wrap, tissue, and boxes appropriate for your items.',
      'Add branded touches - custom tissue paper, thank you notes, or stickers make unboxing special.',
      'Use quality boxes - invest in boxes that reflect your brand\'s premium nature.',
      'Pack thoughtfully - arrange items to look intentional, not hastily thrown together.',
      'Include care instructions - help customers maintain and cherish your work.',
      'Use tracked shipping - opt for services with tracking so customers can follow delivery.',
      'Insure valuable items - protect high-value pieces during transit.',
      'Create an unboxing experience - package in a way that encourages customers to share photos.',
    ],
  },
  'repeat-buyers': {
    title: 'How to attract repeat buyers',
    icon: '💝',
    tips: [
      'Deliver exceptional quality - every purchase reinforces whether they\'ll return.',
      'Follow up after purchase - send a thank you message and ask for feedback.',
      'Create a loyalty program - offer discounts or early access to repeat customers.',
      'Release new designs regularly - give customers reasons to come back.',
      'Personalize communication - remember customer preferences and past purchases.',
      'Ask for reviews - encourage satisfied customers to leave testimonials.',
      'Offer gift options - make it easy for friends to buy your work for occasions.',
      'Build community - share behind-the-scenes content and involve customers in your journey.',
    ],
  },
  visibility: {
    title: 'Boost your visibility and reach',
    icon: '🌟',
    tips: [
      'Optimize your product titles - use keywords customers actually search for.',
      'Write detailed descriptions - be specific about materials, dimensions, and care.',
      'Use all available photos - show your best work in multiple views and settings.',
      'Leverage social media - share process videos, customer photos, and behind-the-scenes moments.',
      'Engage with your community - respond to comments and messages quickly and kindly.',
      'Collaborate with other artisans - cross-promote and expand your reach together.',
      'Use hashtags strategically - research and use relevant hashtags that reach your audience.',
      'Post consistently - maintain a regular presence to stay visible in feeds and algorithms.',
    ],
  },
}

interface LearningModalProps {
  guide: string
  onClose: () => void
}

export default function LearningModal({ guide, onClose }: LearningModalProps) {
  const [markedAsRead, setMarkedAsRead] = useState(false)
  const [savedForLater, setSavedForLater] = useState(false)

  const content = guideContent[guide] || guideContent.photography
  const tips = content.tips || []

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <div className="p-6 border-b border-border sticky top-0 bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{content.icon}</span>
            <h2 className="text-2xl font-bold text-foreground">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Step-by-step guide</h3>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-1">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6 flex gap-3">
            <Button
              onClick={() => setMarkedAsRead(!markedAsRead)}
              variant={markedAsRead ? 'default' : 'outline'}
              className="flex-1 border-primary/30"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {markedAsRead ? 'Marked as Read' : 'Mark as Read'}
            </Button>
            <Button
              onClick={() => setSavedForLater(!savedForLater)}
              variant={savedForLater ? 'default' : 'outline'}
              className="flex-1 border-primary/30"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {savedForLater ? 'Saved' : 'Save for Later'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
