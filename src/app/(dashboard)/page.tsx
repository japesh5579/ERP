import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats } from "@/lib/dashboard"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { ProductionChart } from "@/components/dashboard/ProductionChart"
import { StockAlerts } from "@/components/dashboard/StockAlerts"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import Link from "next/link"
import { Package, MinusCircle, ClipboardList, AlertTriangle } from "lucide-react"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2.5">
      {children}
    </p>
  )
}

/* ── Worker kiosk dashboard ─────────────────────────────────────────────── */
async function WorkerDashboard({
  workerName,
  stockAlerts,
}: {
  workerName: string
  stockAlerts: { id: string; name: string; currentStock: number; minimumStock: number; unit: string; category: string }[]
}) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = workerName.split(" ")[0]

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Greeting banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white">
        <p className="text-blue-200 text-sm">{greeting}</p>
        <p className="text-3xl font-extrabold mt-1">{firstName}!</p>
        <p className="text-blue-200 text-sm mt-2">
          Tap an item below to record material usage.
        </p>
      </div>

      {/* Quick actions — big tap targets for kiosk */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/inventory"
            className="group bg-white rounded-3xl border border-border p-5 flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] card-press"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <MinusCircle className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">Record Usage</p>
              <p className="text-sm text-muted-foreground mt-0.5">Browse inventory and log used materials</p>
            </div>
            <div className="text-muted-foreground/40">→</div>
          </Link>

          <Link
            href="/inventory"
            className="group bg-white rounded-3xl border border-border p-5 flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] card-press"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
              <Package className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">Browse Inventory</p>
              <p className="text-sm text-muted-foreground mt-0.5">View all materials and current stock levels</p>
            </div>
            <div className="text-muted-foreground/40">→</div>
          </Link>

          <Link
            href="/my-usage"
            className="group bg-white rounded-3xl border border-border p-5 flex items-center gap-5 hover:shadow-md transition-all active:scale-[0.98] card-press"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
              <ClipboardList className="w-7 h-7 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">My Activity</p>
              <p className="text-sm text-muted-foreground mt-0.5">See your material usage history</p>
            </div>
            <div className="text-muted-foreground/40">→</div>
          </Link>
        </div>
      </div>

      {/* Stock alerts visible to workers */}
      {stockAlerts.length > 0 && (
        <div>
          <SectionLabel>Stock Alerts</SectionLabel>
          <div className="bg-white rounded-3xl border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <p className="text-sm font-bold text-orange-700">
                {stockAlerts.length} material{stockAlerts.length !== 1 ? "s" : ""} running low
              </p>
            </div>
            <div className="space-y-2">
              {stockAlerts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium truncate flex-1 mr-3">{a.name}</span>
                  <span className="text-red-600 font-bold tabular-nums flex-shrink-0">
                    {a.currentStock} {a.unit}
                  </span>
                </div>
              ))}
              {stockAlerts.length > 4 && (
                <p className="text-xs text-muted-foreground">+{stockAlerts.length - 4} more items</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"

  if (!isAdmin) {
    const { stockAlerts } = await getDashboardStats()
    return <WorkerDashboard workerName={session.user.name} stockAlerts={stockAlerts} />
  }

  const stats = await getDashboardStats()

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Key Performance Indicators</SectionLabel>
        <StatsCards
          totalMaterials={stats.totalMaterials}
          lowStockCount={stats.lowStockCount}
          activeProductions={stats.activeProductions}
          completedThisMonth={stats.completedThisMonth}
          pendingQC={stats.pendingQC}
          dispatchesToday={stats.dispatchesToday}
          totalRevenue={stats.totalRevenue}
          pendingRevenue={stats.pendingRevenue}
          stockAlertCount={stats.stockAlerts.length}
        />
      </div>
      <div>
        <SectionLabel>Production Analysis</SectionLabel>
        <ProductionChart monthlyOutput={stats.monthlyOutput} productionByStage={stats.productionByStage} />
      </div>
      <div>
        <SectionLabel>Alerts & Activity</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <StockAlerts alerts={stats.stockAlerts} />
          <RecentActivity activities={stats.recentActivity} />
        </div>
      </div>
    </div>
  )
}
