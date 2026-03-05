export function CommunityCard() {
  const artisans = [
    { initials: "AK", name: "Amara Kinyatta", craft: "Beaded Jewelry" },
    { initials: "RJ", name: "Rahul Joshi", craft: "Pottery" },
    { initials: "NK", name: "Nalini Kumar", craft: "Silk Weaving" },
    { initials: "DC", name: "Diego Cortez", craft: "Woodcarving" },
  ]

  return (
    <div className="bg-card rounded-2xl p-8 border border-border">
      <h3 className="text-xl font-bold text-foreground mb-2">Community Highlights</h3>
      <p className="text-sm text-foreground/60 mb-6">Artisans like you are being discovered</p>

      <div className="flex flex-wrap gap-6">
        {artisans.map((artisan, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
              <span className="font-bold text-primary text-sm">{artisan.initials}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{artisan.name}</p>
              <p className="text-xs text-foreground/60">{artisan.craft}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
