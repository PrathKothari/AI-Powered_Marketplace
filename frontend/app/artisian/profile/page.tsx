'use client'

import { useAppSelector } from '@/store/hooks'

import AboutSection from '@/components/about-section'
import BusinessInfoCard from '@/components/business-info'
import PerformanceSnapshot from '@/components/performance-snapshot'
import CustomerFeedback from '@/components/customer-feedback'
import ActionsPanel from '@/components/actions-panel'

export default function ArtisianProfile() {
  const profile = useAppSelector((state) => state.profile)

  return (
    <div className="space-y-8 mt-8">
      <AboutSection
        craftType={profile.craftType}
        yearsOfExperience={profile.yearsExperience}
        craftDescription={profile.craftDescription}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BusinessInfoCard
          village={profile.village}
          region={profile.state}
          language={profile.language}
        />
        <PerformanceSnapshot />
      </div>

      <CustomerFeedback />
      <ActionsPanel />
    </div>
  )
}
