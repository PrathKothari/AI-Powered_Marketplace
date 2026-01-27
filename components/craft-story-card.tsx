"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Sparkles } from "lucide-react"

export function CraftStoryCard() {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  return (
    <div
      className="bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl p-8 border border-border h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-2xl font-bold text-foreground mb-6">My Craft Story</h3>

      <div className="flex-1 mb-6">
        <div className="w-full h-40 bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden">
          <img
            src="/traditional-textile-art.jpg"
            alt="Craft thumbnail"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <p className="text-sm text-foreground/70 leading-relaxed">
            For three generations, our family has woven stories into every piece. Each thread carries tradition,
            passion, and the dreams of our village. Our handmade textiles aren't just products—they are conversations
            between cultures.
          </p>
        </div>
      </div>

      <p className="text-xs text-foreground/50 mb-4">
        ✨ Your story helps buyers connect with your craft
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/artisian/story")}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isHovered
              ? "bg-primary text-primary-foreground"
              : "bg-border text-foreground hover:bg-border/80"
          }`}
        >
          <Edit size={16} />
          Edit Story
        </button>

        <button
          onClick={() => router.push("/artisian/story?mode=ai")}
          className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Generate with AI
        </button>
      </div>
    </div>
  )
}
