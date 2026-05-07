'use client'

import { useState } from 'react'
import { Star, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Review {
  id: number
  author: string
  rating: number
  text: string
  date: string
}

const reviews: Review[] = [
  {
    id: 1,
    author: 'Anita Verma',
    rating: 5,
    text: 'Absolutely beautiful terracotta bowls! The craftsmanship is exceptional and they arrived safely. Highly recommend!',
    date: 'Dec 15, 2024',
  },
  {
    id: 2,
    author: 'Rajesh Kumar',
    rating: 5,
    text: 'Great customer service and authentic handmade pottery. Worth every penny. Already planning my next purchase!',
    date: 'Dec 10, 2024',
  },
  {
    id: 3,
    author: 'Priya Mishra',
    rating: 4,
    text: 'Love the aesthetic! Minor shipping delay but seller communicated throughout. Would order again.',
    date: 'Dec 5, 2024',
  },
]

function ReviewCard({ review }: { review: Review }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-0 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-foreground">{review.author}</p>
          <p className="text-xs text-muted-foreground">{review.date}</p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-border'}
            />
          ))}
        </div>
      </div>

      <p className={`text-sm text-muted-foreground ${!isExpanded && 'line-clamp-2'}`}>
        {review.text}
      </p>

      {review.text.length > 100 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold mt-2 inline-flex items-center gap-1"
          style={{ color: 'var(--primary)' }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown size={12} className={isExpanded ? 'rotate-180' : ''} />
        </button>
      )}
    </Card>
  )
}

export default function CustomerFeedback() {
  return (
    <Card className="border-0 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Customer Feedback</h2>
        <Button
          variant="outline"
          style={{
            borderColor: 'var(--primary)',
            color: 'var(--primary)',
          }}
        >
          View All Reviews
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </Card>
  )
}
