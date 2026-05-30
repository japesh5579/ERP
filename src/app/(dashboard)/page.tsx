import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats } from "@/lib/dashboard"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { ProductionChart } from "@/components/dashboard/ProductionChart"
import { StockAlerts } from "@/components/dashboard/StockAlerts"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
      {children}
    </p>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const stats = await getDashboardStats()

  return (
    <div className="space-y-5">

      {/* KPI tiles */}
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

      {/* Charts */}
      <div>
        <SectionLabel>Production Analysis</SectionLabel>
        <ProductionChart
          monthlyOutput={stats.monthlyOutput}
          productionByStage={stats.productionByStage}
        />
      </div>

      {/* Bottom panels */}
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
