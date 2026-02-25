"use client"

import { Button } from "@/components/ui/button"

interface EditorCardProps {
  title: string
  setTitle: (value: string) => void
  story: string
  setStory: (value: string) => void
  wordCount: number
}

export function EditorCard({ title, setTitle, story, setStory, wordCount }: EditorCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md border border-border overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            Your Craft Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Handcrafted Ceramic Pottery"
            className="w-full text-2xl font-serif font-semibold text-foreground bg-transparent border-b-2 border-muted focus:border-primary outline-none pb-2 placeholder:text-muted-foreground transition-colors"
          />
        </div>

        {/* Story Textarea */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            Your Craft Story
          </label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Tell us about your craft, your inspiration, and what makes your work unique. Share your journey as an artisan..."
            className="w-full h-80 p-4 text-foreground bg-muted/50 border border-muted rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none placeholder:text-muted-foreground transition-colors leading-relaxed"
          />

          {/* Word Counter */}
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Word count: <strong className="text-foreground">{wordCount}</strong>
            </span>
            <span className="text-xs text-muted-foreground">Recommended: 100-500 words</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-border">
          <Button onClick={() => {}} variant="outline" className="flex-1">
            Save Draft
          </Button>
          <Button onClick={() => {}} className="flex-1">
            Publish Story
          </Button>
        </div>
      </div>
    </div>
  )
}
