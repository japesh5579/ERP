import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MaterialCategory } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        vendor: true,
        usageRecords: {
          orderBy: { usedAt: "desc" },
          take: 10,
          include: {
            transformer: {
              select: { id: true, modelNumber: true, serialNumber: true },
            },
          },
        },
      },
    })

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("[INVENTORY_ID_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.rawMaterial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    const {
      name,
      category,
      currentStock,
      unit,
      minimumStock,
      unitPrice,
      location,
      description,
      vendorId,
    } = body

    const updated = await prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category: category as MaterialCategory }),
        ...(currentStock !== undefined && { currentStock }),
        ...(unit !== undefined && { unit }),
        ...(minimumStock !== undefined && { minimumStock }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(vendorId !== undefined && { vendorId: vendorId ?? null }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[INVENTORY_ID_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const existing = await prisma.rawMaterial.findUnique({
      where: { id },
      include: { _count: { select: { usageRecords: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    if (existing._count.usageRecords > 0) {
      return NextResponse.json(
        { error: "Cannot delete material with existing usage records" },
        { status: 409 }
      )
    }

    await prisma.rawMaterial.delete({ where: { id } })

    return NextResponse.json({ message: "Material deleted successfully" })
  } catch (error) {
    console.error("[INVENTORY_ID_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
