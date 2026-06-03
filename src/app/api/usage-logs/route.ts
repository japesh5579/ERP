import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") ?? ""
    const materialId = searchParams.get("materialId") ?? ""
    const take = Math.min(parseInt(searchParams.get("take") ?? "50"), 100)

    // Workers can only see their own logs; admins can see all
    const isAdmin = session.user.role === "ADMIN"
    const filterUserId = isAdmin ? (userId || undefined) : session.user.id

    const logs = await prisma.materialUsage.findMany({
      where: {
        ...(filterUserId ? { userId: filterUserId } : {}),
        ...(materialId ? { materialId } : {}),
        quantity: { gt: 0 }, // only OUT movements (positive = usage)
      },
      include: {
        material: { select: { id: true, name: true, unit: true, category: true } },
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { usedAt: "desc" },
      take,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("[USAGE_LOGS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
