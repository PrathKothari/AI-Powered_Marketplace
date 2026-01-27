"use client"

import { useEffect, useState } from "react"

interface StoryPreviewProps {
  title: string
  story: string
}

export function StoryPreview({ title, story }: StoryPreviewProps) {
  const [artisanName, setArtisanName] = useState("Artisan")

  useEffect(() => {
    const name = localStorage.getItem("artisanName")
    if (name) setArtisanName(name)
  }, [])

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-md border border-border overflow-hidden">
      <div className="bg-muted px-6 py-4 border-b border-border">
        <h3 className="font-serif font-semibold text-sm">Live Preview</h3>
        <p className="text-xs text-muted-foreground mt-1">
          How buyers will see your story
        </p>
      </div>

      <div className="p-6">
        {title || story ? (
          <div className="space-y-4">
            {/* Image Placeholder */}
            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground mb-4">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs">Craft image preview</p>
              </div>
            </div>

            {title && (
              <h2 className="text-lg font-serif font-bold text-foreground text-balance">
                {title}
              </h2>
            )}

            <div className="text-xs text-muted-foreground border-b border-border pb-3">
              By {artisanName}
            </div>

            {story && (
              <p className="text-sm text-foreground leading-relaxed text-pretty">
                {story}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              Start writing to see your story come alive here ✨
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
