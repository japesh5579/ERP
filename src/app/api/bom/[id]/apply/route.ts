import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const qty = Math.max(1, Number(body.quantity) || 1) // how many units to build
    const notes: string = body.notes || ""

    const bom = await prisma.billOfMaterials.findUnique({
      where: { id },
      include: {
        items: {
          include: { material: true },
        },
      },
    })
    if (!bom) return NextResponse.json({ error: "BOM not found" }, { status: 404 })

    // Check stock for all items
    const insufficient: { name: string; needed: number; available: number; unit: string }[] = []
    for (const item of bom.items) {
      const needed = item.quantity * qty
      if (item.material.currentStock < needed) {
        insufficient.push({
          name: item.material.name,
          needed,
          available: item.material.currentStock,
          unit: item.material.unit,
        })
      }
    }

    if (insufficient.length > 0) {
      return NextResponse.json({ error: "Insufficient stock", insufficient }, { status: 422 })
    }

    // Deduct all materials in one transaction
    await prisma.$transaction([
      ...bom.items.map((item) =>
        prisma.rawMaterial.update({
          where: { id: item.materialId },
          data: { currentStock: { decrement: item.quantity * qty } },
        })
      ),
      ...bom.items.map((item) =>
        prisma.materialUsage.create({
          data: {
            materialId: item.materialId,
            quantity: item.quantity * qty,
            notes: `BOM: ${bom.name} × ${qty}${notes ? ` — ${notes}` : ""}`,
            usedBy: session.user.id,
          },
        })
      ),
    ])

    // Trim old history in background
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    prisma.materialUsage.deleteMany({ where: { usedAt: { lt: cutoff } } }).catch(() => {})

    return NextResponse.json({ ok: true, message: `Built ${qty} × ${bom.name} — ${bom.items.length} materials deducted` })
  } catch (error) {
    console.error("[BOM_APPLY]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
