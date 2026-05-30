import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error("[PURCHASE_ORDERS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { vendorId, expectedDate, notes, items } = body

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.materialId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: "Each item requires materialId, quantity, and unitPrice" },
          { status: 400 }
        )
      }
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )

    const orderNumber = generateOrderNumber()

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        vendorId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes ?? null,
        totalAmount,
        status: "PENDING",
        items: {
          create: items.map(
            (item: { materialId: string; quantity: number; unitPrice: number }) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })
          ),
        },
      },
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true, category: true } },
          },
        },
      },
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error("[PURCHASE_ORDERS_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
