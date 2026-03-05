'use client'

export type MarketplaceFilter = 'all' | 'in-stock' | 'out-stock'

interface FilterBarProps {
  activeFilter: MarketplaceFilter
  onFilterChange: (filter: MarketplaceFilter) => void
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters: { id: MarketplaceFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'in-stock', label: 'Active' },
    { id: 'out-stock', label: 'Out of Stock' },
  ]

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-accent/20 hover:bg-muted/50'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
