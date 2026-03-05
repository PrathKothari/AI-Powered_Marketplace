import { StoryEditor } from "@/components/story-editor"
import { Sidebar } from "@/components/sidebar"

export default function StoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1">
        <StoryEditor />
      </main>
    </div>
  )
}
