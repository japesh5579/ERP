import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Query row counts for all main tables
  const [
    users, materials, vendors, purchaseOrders, transformers,
    materialUsages, qualityTests, dispatches, loginLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.rawMaterial.count(),
    prisma.vendor.count(),
    prisma.purchaseOrder.count(),
    prisma.transformer.count(),
    prisma.materialUsage.count(),
    prisma.qualityTest.count(),
    prisma.dispatch.count(),
    prisma.loginLog.count(),
  ])

  // Get actual DB size (Postgres)
  const sizeResult = await prisma.$queryRaw<{ size: string }[]>`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS size
  `

  return NextResponse.json({
    dbSize: sizeResult[0]?.size ?? "unknown",
    rows: {
      users, materials, vendors, purchaseOrders,
      transformers, materialUsages, qualityTests, dispatches, loginLogs,
    },
  })
}
