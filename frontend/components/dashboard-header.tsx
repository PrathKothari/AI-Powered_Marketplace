export function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border">
      <div className="px-6 md:px-8 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-foreground">KalaSetu</h1>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">SA</span>
          </div>
        </div>
      </div>
    </header>
  )
}
