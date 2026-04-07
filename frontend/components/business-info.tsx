'use client'

import { Card } from '@/components/ui/card'

export interface BusinessInfoCardProps {
  village: string
  region: string
  language: string
}

export default function BusinessInfoCard(props: BusinessInfoCardProps) {
  const { village, region, language } = props

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Business Info</h2>

      <p><strong>Village:</strong> {village}</p>
      <p><strong>Region:</strong> {region}</p>
      <p><strong>Language:</strong> {language}</p>
    </Card>
  )
}
