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
    const { items } = body as {
      items: { materialId: string; quantity: number; notes?: string }[]
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 })
    }

    const transformer = await prisma.transformer.findUnique({ where: { id } })
    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    // Validate stock availability before touching anything
    const materialIds = items.map((i) => i.materialId)
    const materials = await prisma.rawMaterial.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, currentStock: true, unit: true },
    })

    const materialMap = new Map(materials.map((m) => [m.id, m]))
    const insufficient: string[] = []
    for (const item of items) {
      const mat = materialMap.get(item.materialId)
      if (!mat) {
        return NextResponse.json({ error: `Material ${item.materialId} not found` }, { status: 404 })
      }
      if (mat.currentStock < item.quantity) {
        insufficient.push(`${mat.name}: need ${item.quantity} ${mat.unit}, only ${mat.currentStock} available`)
      }
    }
    if (insufficient.length > 0) {
      return NextResponse.json(
        { error: "Insufficient stock", details: insufficient },
        { status: 422 }
      )
    }

    // All good — deduct stock and record usage in one transaction
    const usages = await prisma.$transaction(async (tx) => {
      const created = []
      for (const item of items) {
        await tx.rawMaterial.update({
          where: { id: item.materialId },
          data: { currentStock: { decrement: item.quantity } },
        })

        const usage = await tx.materialUsage.create({
          data: {
            transformerId: id,
            materialId: item.materialId,
            quantity: item.quantity,
            notes: item.notes ?? null,
            usedBy: session.user.id,
          },
          include: {
            material: { select: { id: true, name: true, unit: true, category: true } },
          },
        })
        created.push(usage)
      }
      return created
    })

    return NextResponse.json(usages, { status: 201 })
  } catch (error) {
    console.error("[MATERIAL_USAGE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
