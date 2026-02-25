"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mb-6 flex justify-center">
        <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center">
          <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a6 6 0 016 6v10a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-6-6H7a2 2 0 00-2 2v4a4 4 0 004 4z"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">You haven't added any products yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Start showcasing your handmade creations and begin selling to customers who love artisan goods.
      </p>
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Craft
      </Button>
    </div>
  )
}
