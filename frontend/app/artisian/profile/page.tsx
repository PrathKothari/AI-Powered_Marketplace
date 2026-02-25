'use client'

import { useState } from 'react'
import { Star, MapPin, Phone, Mail, Edit2, Eye, LogOut, Lock, User } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

import ProfileHeader from '../../../components/profile-header'
import AboutSection from '../../../components/about-section'
import BusinessInfoCard from '../../../components/business-info'
import PerformanceSnapshot from '../../../components/performance-snapshot'
import CustomerFeedback from '../../../components/customer-feedback'
import ActionsPanel from '../../../components/actions-panel'
import EditProfileModal from '../../../components/edit-profile-modal'

export default function ArtisanProfile() {
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Profile Header */}
        <ProfileHeader onEdit={() => setShowEditModal(true)} />

        {/* Main Content Grid */}
        <div className="space-y-8 mt-8">
          {/* About Section */}
          <AboutSection />

          {/* Business Info & Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BusinessInfoCard />
            <PerformanceSnapshot />
          </div>

          {/* Customer Feedback */}
          <CustomerFeedback />

          {/* Actions Panel */}
          <ActionsPanel />
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal onClose={() => setShowEditModal(false)} />
      )}
    </div>
  )
}
