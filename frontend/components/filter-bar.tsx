"use client"

interface FilterBarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters = [
    { id: "all", label: "All" },
    { id: "in-stock", label: "Active" },
    { id: "out-stock", label: "Out of Stock" },
  ]

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-accent/20 text-foreground hover:bg-muted/50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
