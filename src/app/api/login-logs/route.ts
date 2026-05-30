import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const logs = await prisma.loginLog.findMany({
      take: 50,
      orderBy: { loginAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("[LOGIN_LOGS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
