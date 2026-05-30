import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { POStatus } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                category: true,
                unit: true,
                currentStock: true,
                minimumStock: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error("[PURCHASE_ORDER_ID_GET]", error)
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

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { material: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    const { status, receivedDate, notes } = body

    const becomingReceived =
      status === "RECEIVED" && existing.status !== "RECEIVED"

    let updatedPO

    if (becomingReceived) {
      // When PO is marked RECEIVED: update stock for each item
      updatedPO = await prisma.$transaction(async (tx) => {
        // Increment currentStock for each material in the PO
        for (const item of existing.items) {
          await tx.rawMaterial.update({
            where: { id: item.materialId },
            data: { currentStock: { increment: item.quantity } },
          })
        }

        return tx.purchaseOrder.update({
          where: { id },
          data: {
            status: "RECEIVED" as POStatus,
            receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
            ...(notes !== undefined && { notes }),
          },
          include: {
            vendor: { select: { id: true, name: true, email: true, phone: true } },
            items: {
              include: {
                material: {
                  select: { id: true, name: true, category: true, unit: true, currentStock: true },
                },
              },
            },
          },
        })
      })
    } else {
      updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: {
          ...(status !== undefined && { status: status as POStatus }),
          ...(receivedDate !== undefined && {
            receivedDate: receivedDate ? new Date(receivedDate) : null,
          }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          vendor: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              material: {
                select: { id: true, name: true, category: true, unit: true, currentStock: true },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(updatedPO)
  } catch (error) {
    console.error("[PURCHASE_ORDER_ID_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
