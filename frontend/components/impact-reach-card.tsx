import { Globe2, Users } from "lucide-react"

export function ImpactReachCard() {
  return (
    <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-2xl p-8 border border-border">
      <h3 className="text-xl font-bold text-foreground mb-8">Impact & Reach</h3>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Globe2 size={24} className="text-accent" />
          </div>
          <div>
            <p className="text-sm text-foreground/60 font-medium">Your crafts reached</p>
            <p className="text-2xl font-bold text-foreground">7 cities</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Users size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-foreground/60 font-medium">Buyers discovered</p>
            <p className="text-2xl font-bold text-foreground">12 this week</p>
            <p className="text-xs text-foreground/50 mt-1">in your story</p>
          </div>
        </div>
      </div>
    </div>
  )
}
