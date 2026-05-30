import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDashboardStats } from "@/lib/dashboard"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
