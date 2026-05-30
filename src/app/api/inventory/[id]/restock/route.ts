import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const qty = Number(body.quantity)
    const notes: string | null = body.notes || null

    if (!qty || qty <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    const material = await prisma.rawMaterial.findUnique({ where: { id } })
    if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const [updated] = await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id },
        data: { currentStock: { increment: qty } },
        include: { vendor: true },
      }),
      prisma.materialUsage.create({
        data: {
          materialId: id,
          quantity: -qty,
          notes: notes ? `Manual restock — ${notes}` : "Manual restock",
        },
      }),
    ])

    // Silently trim movement history older than 6 months — keeps DB small
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    prisma.materialUsage.deleteMany({ where: { usedAt: { lt: cutoff } } }).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[INVENTORY_RESTOCK]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
