'use client'

import { useState } from 'react'
import HelpHeader from '../../../components/help/help-header'
import LearningHub from '../../../components/help/learning-hub'
import QuickHelpActions from '../../../components/help/quick-help-actions'
import GrowthTools from '../../../components/help/growth-tools'
import FAQSupport from '../../../components/help/faq-support'
import LearningModal from '../../../components/help/learning-modal'
import AiMentorPanel from '../../../components/help/ai-mentor-panel'

export default function HelpPage() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)
  const [showAIMentor, setShowAIMentor] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HelpHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        <LearningHub onSelectGuide={setSelectedGuide} />
        <QuickHelpActions onOpenAIMentor={() => setShowAIMentor(true)} />
        <GrowthTools />
        <FAQSupport />
      </main>

      {selectedGuide && (
        <LearningModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}

      {showAIMentor && (
  <AiMentorPanel onClose={() => setShowAIMentor(false)} />
)}

    </div>
  )
}
