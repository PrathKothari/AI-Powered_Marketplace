"use client"
import { useEffect, useState } from "react"

export function ProfileCard() {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const storedName = localStorage.getItem("artisanName")
    setName(storedName)
  }, [])

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12 border border-border">
      <div className="max-w-2xl">
        <p className="text-primary font-semibold text-lg mb-2">Namaste,</p>

        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
          {name || "Artisan"}
        </h2>

        <p className="text-lg text-foreground/70 mb-8 text-balance">
          Your craft is your story. Let's share it with the world.
        </p>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
              <span className="text-3xl">🧵</span>
            </div>
            <div>
              <p className="text-sm text-foreground/60 font-medium">Profile Completion</p>
              <div className="w-32 h-2 bg-border rounded-full overflow-hidden mt-2">
                <div className="w-3/4 h-full bg-primary rounded-full"></div>
              </div>
              <p className="text-xs text-foreground/50 mt-1">75% Complete</p>
            </div>
          </div>

          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  )
}
