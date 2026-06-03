import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MaterialCategory } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const category = searchParams.get("category") ?? ""

    const materials = await prisma.rawMaterial.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { location: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          category ? { category: category as MaterialCategory } : {},
        ],
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error("[INVENTORY_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 })
    }

    const body = await req.json()
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
      imageUrl,
    } = body

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: "name, category, and unit are required" },
        { status: 400 }
      )
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        category: category as MaterialCategory,
        currentStock: currentStock ?? 0,
        unit,
        minimumStock: minimumStock ?? 10,
        unitPrice: unitPrice ?? 0,
        location: location ?? null,
        description: description ?? null,
        vendorId: vendorId ?? null,
        imageUrl: imageUrl ?? null,
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error("[INVENTORY_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
