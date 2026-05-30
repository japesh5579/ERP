import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import type { DashboardStats } from "@/types"

async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Build month ranges for last 6 months upfront
  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    const label = start.toLocaleString("en-IN", { month: "short", year: "2-digit" })
    return { start, end, label }
  })

  // Fire ALL queries simultaneously in one Promise.all — no sequential round-trips
  const [
    totalMaterials,
    allMaterials,
    activeProductions,
    completedThisMonth,
    pendingQC,
    dispatchesToday,
    revenueData,
    productionByStageRaw,
    recentTransformers,
    recentTests,
    recentDispatches,
    recentPOs,
    ...monthlyRaw
  ] = await Promise.all([
    prisma.rawMaterial.count(),

    prisma.rawMaterial.findMany({
      select: { id: true, name: true, currentStock: true, minimumStock: true, unit: true, category: true },
    }),

    prisma.transformer.count({ where: { status: "IN_PRODUCTION" } }),

    prisma.transformer.count({
      where: { status: "COMPLETED", completedAt: { gte: startOfMonth } },
    }),

    prisma.transformer.count({
      where: { status: "IN_PRODUCTION", currentStage: { in: ["TESTING", "QC_APPROVAL"] } },
    }),

    prisma.dispatch.count({
      where: { createdAt: { gte: startOfToday, lt: endOfToday } },
    }),

    prisma.dispatch.findMany({
      select: { invoiceAmount: true, paidAmount: true },
    }),

    prisma.transformer.groupBy({
      by: ["currentStage"],
      _count: { id: true },
    }),

    // Recent activity — all 4 tables
    prisma.transformer.findMany({
      take: 5, orderBy: { updatedAt: "desc" },
      select: { id: true, modelNumber: true, currentStage: true, status: true, updatedAt: true },
    }),
    prisma.qualityTest.findMany({
      take: 5, orderBy: { testedAt: "desc" },
      select: {
        id: true, testType: true, result: true, testedAt: true,
        transformer: { select: { modelNumber: true } },
      },
    }),
    prisma.dispatch.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, invoiceNumber: true, deliveryStatus: true, createdAt: true,
        transformer: { select: { modelNumber: true } },
      },
    }),
    prisma.purchaseOrder.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, orderNumber: true, status: true, createdAt: true,
        vendor: { select: { name: true } },
      },
    }),

    // 6 months × 2 queries — all parallel, spread into rest array
    ...monthRanges.flatMap(({ start, end }) => [
      prisma.transformer.count({
        where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
      }),
      prisma.dispatch.aggregate({
        where: { createdAt: { gte: start, lt: end } },
        _sum: { invoiceAmount: true },
      }),
    ]),
  ])

  // Reconstruct monthly output from the flat rest array (pairs of [count, aggregate])
  const monthlyOutput = monthRanges.map(({ label }, i) => {
    const count   = monthlyRaw[i * 2] as number
    const agg     = monthlyRaw[i * 2 + 1] as { _sum: { invoiceAmount: number | null } }
    return { month: label, count, revenue: agg._sum.invoiceAmount ?? 0 }
  })

  const lowStockItems = allMaterials.filter((m) => m.currentStock < m.minimumStock)
  const stockAlerts   = lowStockItems.slice(0, 20).map((m) => ({ ...m, category: m.category as string }))
  const totalRevenue  = revenueData.reduce((s, d) => s + d.invoiceAmount, 0)
  const pendingRevenue = revenueData.reduce((s, d) => s + Math.max(0, d.invoiceAmount - d.paidAmount), 0)

  const productionByStage = productionByStageRaw.map((r) => ({
    stage: r.currentStage as string,
    count: r._count.id,
  }))

  const recentActivity = [
    ...recentTransformers.map((t) => ({
      id: t.id, type: "production" as const,
      message: `${t.modelNumber} — ${t.currentStage.replace(/_/g, " ")}`,
      time: t.updatedAt.toISOString(),
    })),
    ...recentTests.map((t) => ({
      id: t.id, type: "quality" as const,
      message: `${t.testType.replace(/_/g, " ")} on ${t.transformer.modelNumber}: ${t.result}`,
      time: t.testedAt.toISOString(),
    })),
    ...recentDispatches.map((d) => ({
      id: d.id, type: "dispatch" as const,
      message: `${d.invoiceNumber} — ${d.transformer.modelNumber} (${d.deliveryStatus})`,
      time: d.createdAt.toISOString(),
    })),
    ...recentPOs.map((p) => ({
      id: p.id, type: "inventory" as const,
      message: `PO ${p.orderNumber} from ${p.vendor.name} — ${p.status}`,
      time: p.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)

  return {
    totalMaterials,
    lowStockCount: lowStockItems.length,
    activeProductions,
    completedThisMonth,
    pendingQC,
    dispatchesToday,
    totalRevenue,
    pendingRevenue,
    productionByStage,
    monthlyOutput,
    stockAlerts,
    recentActivity,
  }
}

// Cache dashboard stats for 60 seconds — avoids hammering the DB on every navigation
export const getDashboardStats = unstable_cache(
  fetchDashboardStats,
  ["dashboard-stats"],
  { revalidate: 60 }
)
