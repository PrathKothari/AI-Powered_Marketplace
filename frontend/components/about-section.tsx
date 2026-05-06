'use client'

import { Card } from '@/components/ui/card'

export interface AboutSectionProps {
  craftType: string
  yearsOfExperience: number
  craftDescription: string
}

export default function AboutSection(props: AboutSectionProps) {
  const { craftType, yearsOfExperience, craftDescription } = props

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">About the Artisan</h2>

      <p><strong>Craft:</strong> {craftType}</p>
      <p><strong>Experience:</strong> {yearsOfExperience} years</p>
      <p>{craftDescription}</p>
    </Card>
  )
}
