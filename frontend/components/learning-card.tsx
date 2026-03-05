"use client"

import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function LearningCard() {
  const router = useRouter()

  const resources = [
    {
      label: "How to photograph your craft",
      path: "/artisian/help?topic=photography",
    },
    {
      label: "Pricing your handmade products",
      path: "/artisian/help?topic=pricing",
    },
    {
      label: "Telling your story in your own voice",
      path: "/artisian/help?topic=storytelling",
    },
  ]

  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-foreground mb-2">Grow with CraftHub</h3>
      <p className="text-sm text-foreground/60 mb-6">Learning resources</p>

      <div className="space-y-3">
        {resources.map((resource, i) => (
          <button
            key={i}
            onClick={() => router.push(resource.path)}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors group"
          >
            <span className="text-foreground font-medium text-left text-sm">
              {resource.label}
            </span>
            <ChevronRight
              size={18}
              className="text-foreground/40 group-hover:text-primary transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
