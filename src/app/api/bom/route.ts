import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const boms = await prisma.billOfMaterials.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true, currentStock: true, category: true } },
          },
        },
      },
    })
    return NextResponse.json(boms)
  } catch (error) {
    console.error("[BOM_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, items } = await req.json()
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })

    const bom = await prisma.billOfMaterials.create({
      data: {
        name,
        description: description || null,
        items: {
          create: items.map((i: { materialId: string; quantity: number }) => ({
            materialId: i.materialId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true, currentStock: true, category: true } },
          },
        },
      },
    })

    return NextResponse.json(bom, { status: 201 })
  } catch (error) {
    console.error("[BOM_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
