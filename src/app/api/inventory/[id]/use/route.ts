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
    const { quantity, transformerId, notes } = body

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive number" },
        { status: 400 }
      )
    }

    const material = await prisma.rawMaterial.findUnique({ where: { id } })
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    if (material.currentStock < quantity) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          available: material.currentStock,
          requested: quantity,
          unit: material.unit,
        },
        { status: 422 }
      )
    }

    if (transformerId) {
      const transformer = await prisma.transformer.findUnique({
        where: { id: transformerId },
      })
      if (!transformer) {
        return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
      }
    }

    const [updatedMaterial, usageRecord] = await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id },
        data: { currentStock: { decrement: quantity } },
      }),
      prisma.materialUsage.create({
        data: {
          materialId: id,
          quantity,
          transformerId: transformerId ?? null,
          notes: notes ?? null,
        },
        include: {
          material: { select: { id: true, name: true, unit: true, currentStock: true } },
          transformer: { select: { id: true, modelNumber: true, serialNumber: true } },
        },
      }),
    ])

    // Silently trim movement history older than 6 months — keeps DB small
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    prisma.materialUsage.deleteMany({ where: { usedAt: { lt: cutoff } } }).catch(() => {})

    return NextResponse.json(
      { usageRecord, remainingStock: updatedMaterial.currentStock },
      { status: 201 }
    )
  } catch (error) {
    console.error("[INVENTORY_USE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
