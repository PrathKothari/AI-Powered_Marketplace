'use client'

import { AlertCircle } from 'lucide-react'

export function EmptyMarketplace() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-60" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No crafts found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search to discover beautiful handcrafted items.
        </p>
      </div>
    </div>
  )
}
