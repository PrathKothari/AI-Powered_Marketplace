"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function AIHelper() {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6 border border-border shadow-md">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-serif font-semibold text-foreground mb-1">AI Storytelling Tips</h3>
          <p className="text-sm text-muted-foreground">Get inspiration to elevate your craft story</p>
        </div>
      </div>

      <div className="bg-card/60 rounded-lg p-4 mb-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">💡 Start with your inspiration</p>
          <p className="text-xs text-muted-foreground">What sparked your passion for this craft?</p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">✨ Highlight your uniqueness</p>
          <p className="text-xs text-muted-foreground">What sets your work apart from others?</p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">🎨 Show your process</p>
          <p className="text-xs text-muted-foreground">Describe your creative techniques and materials</p>
        </div>
      </div>

      <Button onClick={() => {}} className="w-full">
        <Sparkles className="w-4 h-4 mr-2" />
        Enhance with AI
      </Button>
    </div>
  )
}
