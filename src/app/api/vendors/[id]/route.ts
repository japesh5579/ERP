import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materials: true, purchaseOrders: true },
        },
        materials: {
          select: {
            id: true,
            name: true,
            category: true,
            currentStock: true,
            unit: true,
            minimumStock: true,
            unitPrice: true,
          },
          orderBy: { name: "asc" },
        },
        purchaseOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            expectedDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error("[VENDOR_ID_GET]", error)
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

    const existing = await prisma.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const { name, email, phone, address, gstNumber, active } = body

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[VENDOR_ID_PATCH]", error)
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

    const existing = await prisma.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Soft delete — set active to false
    const updated = await prisma.vendor.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ message: "Vendor deactivated successfully", vendor: updated })
  } catch (error) {
    console.error("[VENDOR_ID_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
