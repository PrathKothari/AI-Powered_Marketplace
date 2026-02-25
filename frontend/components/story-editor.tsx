"use client"

import { useEffect, useState } from "react"
import { EditorCard } from "./editor-card"
import { AIHelper } from "./ai-helper"
import { StoryPreview } from "./story-preview"

export function StoryEditor() {
  const [title, setTitle] = useState("")
  const [story, setStory] = useState("")
  const [wordCount, setWordCount] = useState(0)

  // Load saved story on first render
  useEffect(() => {
    const savedTitle = localStorage.getItem("storyTitle")
    const savedStory = localStorage.getItem("storyContent")

    if (savedTitle) setTitle(savedTitle)
    if (savedStory) {
      setStory(savedStory)
      const count = savedStory.trim().split(/\s+/).filter(Boolean).length
      setWordCount(count)
    }
  }, [])

  const handleStoryChange = (text: string) => {
    setStory(text)

    const count = text.trim().split(/\s+/).filter(Boolean).length
    setWordCount(count)

    // Persist to localStorage
    localStorage.setItem("storyContent", text)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    localStorage.setItem("storyTitle", value)
  }

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Story Studio
          </h1>
          <p className="text-muted-foreground">
            Write your craft story and let buyers know what makes your work special
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <EditorCard
              title={title}
              setTitle={handleTitleChange}
              story={story}
              setStory={handleStoryChange}
              wordCount={wordCount}
            />
          </div>

          {/* Sidebar with AI Helper and Preview */}
          <div className="space-y-6">
            <AIHelper />
            <StoryPreview title={title} story={story} />
          </div>
        </div>
      </div>
    </div>
  )
}
