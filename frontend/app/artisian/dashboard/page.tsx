"use client"

import { useRouter } from "next/navigation"
import { useAppSelector } from '@/store/hooks'
import { useEffect, useState } from "react"

import type { RootState } from "@/store"

import { DashboardHeader } from "@/components/dashboard-header"
import { ProfileCard } from "@/components/profile-card"
import { CraftStoryCard } from "@/components/craft-story-card"
import { OrdersEarningsCard } from "@/components/orders-earnings-card"
import { ImpactReachCard } from "@/components/impact-reach-card"
import { LearningCard } from "@/components/learning-card"
import { CommunityCard } from "@/components/community-card"
import { Sidebar } from "@/components/sidebar"

export default function Dashboard() {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  const onboardingCompleted = useAppSelector(
    (state: RootState) => state.onboarding.onboardingCompleted
  )

  // ✅ wait for hydration
  useEffect(() => {
    setHydrated(true)
  }, [])

  // ✅ redirect ONLY after hydration
  useEffect(() => {
    if (!hydrated) return

    if (!onboardingCompleted) {
      router.replace("/artisian/onboarding")
    }
  }, [hydrated, onboardingCompleted, router])

  if (!hydrated) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <DashboardHeader />

          <div className="p-6 max-w-7xl mx-auto">
            <ProfileCard />

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div onClick={() => router.push("/artisian/story")}>
                <CraftStoryCard />
              </div>

              <div onClick={() => router.push("/artisian/orders")}>
                <OrdersEarningsCard />
              </div>

              <div onClick={() => router.push("/artisian/impact")}>
                <ImpactReachCard />
              </div>

              <div onClick={() => router.push("/artisian/learning")}>
                <LearningCard />
              </div>
            </div>

            <div
              className="mt-6"
              onClick={() => router.push("/artisian/community")}
            >
              <CommunityCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
