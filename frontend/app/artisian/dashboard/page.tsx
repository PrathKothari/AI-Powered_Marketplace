'use client'

import { useRouter } from 'next/navigation'

import { DashboardHeader } from '@/components/dashboard-header'
import { ProfileCard } from '@/components/profile-card'
import { CraftStoryCard } from '@/components/craft-story-card'
import { OrdersEarningsCard } from '@/components/orders-earnings-card'
import { ImpactReachCard } from '@/components/impact-reach-card'
import { LearningCard } from '@/components/learning-card'
import { CommunityCard } from '@/components/community-card'
import { Sidebar } from '@/components/sidebar'

export default function Dashboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background artisan-pattern">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <DashboardHeader />

          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Hero Section with Profile */}
            <div className="mb-8">
              <ProfileCard />
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Craft Story */}
              <div
                className="md:row-span-2 cursor-pointer transition hover:scale-[1.01]"
                onClick={() => router.push('/artisian/story')}
              >
                <CraftStoryCard />
              </div>

            

              {/* Orders & Earnings */}
              <div
                className="cursor-pointer transition hover:scale-[1.01]"
                onClick={() => router.push('/artisian/orders')}
              >
                <OrdersEarningsCard />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Impact & Reach */}
              <div
                className="cursor-pointer transition hover:scale-[1.01]"
                onClick={() => router.push('/artisian/impact')}
              >
                <ImpactReachCard />
              </div>

              {/* Learning */}
              <div
                className="cursor-pointer transition hover:scale-[1.01]"
                onClick={() => router.push('/artisian/learning')}
              >
                <LearningCard />
              </div>
            </div>

            {/* Community */}
            <div
              className="mt-6 cursor-pointer transition hover:scale-[1.01]"
              onClick={() => router.push('/artisian/community')}
            >
              <CommunityCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
