import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, Package, BarChart3, ArrowRight, Lightbulb, AlertCircle } from "lucide-react"

type ProductInventory = {
  id: number
  name: string
  stock: number
  sales: number
  trend: "high" | "low" | "stable"
}

const mockData: ProductInventory[] = [
  { id: 1, name: "Handwoven Basket", stock: 12, sales: 30, trend: "high" },
  { id: 2, name: "Ceramic Mug Set", stock: 4, sales: 22, trend: "low" },
  { id: 3, name: "Leather Journal", stock: 45, sales: 10, trend: "stable" },
]

export default function SmartInventoryPage() {
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Inventory Insights</h1>
          <p className="text-muted-foreground mt-1">AI-powered demand forecasting for your products</p>
        </div>
        <Button className="gap-2">
          View Detailed Analytics
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-red-500/10 border-red-500/20 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-700 dark:text-red-400">⚠️ 2 products low in stock</span>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-orange-700 dark:text-orange-400">📈 3 products trending this week</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Inventory Cards Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" /> Current Inventory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockData.map((item) => (
                <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-border/50">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge 
                        variant={item.trend === "high" ? "default" : item.trend === "low" ? "destructive" : "secondary"}
                        className={
                          item.trend === "high" ? "bg-orange-500 hover:bg-orange-600 text-white" : 
                          item.trend === "stable" ? "bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/20 dark:text-green-400 border-green-500/20" : ""
                        }
                      >
                        {item.trend === "high" ? "High Demand 🔥" : 
                         item.trend === "low" ? "Low Stock ⚠️" : "Stable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Current Stock</p>
                        <p className="text-2xl font-bold font-mono tracking-tight">{item.stock}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium">Sales (30d)</p>
                        <p className="text-xl font-semibold font-mono tracking-tight">{item.sales}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Chart Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-muted-foreground" /> Sales Trend (Last 7 days)
              </CardTitle>
              <CardDescription>Mock chart data representing daily sales volume.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full flex items-end gap-3 pt-4">
                {[40, 60, 30, 80, 50, 90, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative group cursor-pointer" style={{ height: `${h}%` }}>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-sm border border-border transition-opacity duration-200">
                      {h}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          <Card className="border-indigo-500/20 shadow-indigo-500/5 shadow-xl relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-background">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10 rounded-full" />
            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
              <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Lightbulb className="w-5 h-5 text-indigo-500 fill-indigo-500/20" /> 
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
                <p className="text-sm font-medium leading-relaxed group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">Increase production of <span className="font-semibold">Handwoven Basket</span></p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">High demand trend detected</p>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
                <p className="text-sm font-medium leading-relaxed group-hover:text-orange-600 transition-colors">Restock <span className="font-semibold">Ceramic Mug Set</span></p>
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Stock running low</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-green-100 dark:border-green-900/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
                <p className="text-sm font-medium leading-relaxed group-hover:text-green-600 transition-colors"><span className="font-semibold">Leather Journal</span> demand expected to rise</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Festival season approaching</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
