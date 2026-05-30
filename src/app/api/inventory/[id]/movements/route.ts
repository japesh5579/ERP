import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      select: { id: true, name: true, currentStock: true, unit: true, minimumStock: true },
    })
    if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // All MaterialUsage rows — negative quantity = manual restock (IN), positive = consumption (OUT)
    const usages = await prisma.materialUsage.findMany({
      where: { materialId: id },
      include: { transformer: { select: { modelNumber: true } } },
      orderBy: { usedAt: "desc" },
    })

    // PO items from received purchase orders — always IN
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { materialId: id, purchaseOrder: { status: "RECEIVED" } },
      include: {
        purchaseOrder: {
          select: { orderNumber: true, receivedDate: true, createdAt: true },
        },
      },
    })

    type Movement = {
      id: string
      type: "IN" | "OUT"
      quantity: number
      date: string
      reference: string
      notes: string | null
      balanceAfter: number
    }

    const raw: Omit<Movement, "balanceAfter">[] = [
      // MaterialUsage rows
      ...usages.map((u) => {
        const isRestock = u.quantity < 0
        return {
          id: u.id,
          type: isRestock ? ("IN" as const) : ("OUT" as const),
          quantity: Math.abs(u.quantity),
          date: u.usedAt.toISOString(),
          reference: isRestock
            ? "Manual restock"
            : u.transformer
            ? `Used in ${u.transformer.modelNumber}`
            : "Production use",
          notes: isRestock
            ? (u.notes?.replace(/^Manual restock — ?/, "") ?? null)
            : u.notes,
        }
      }),
      // PO received items
      ...poItems.map((item) => ({
        id: `po-${item.id}`,
        type: "IN" as const,
        quantity: item.quantity,
        date: (item.purchaseOrder.receivedDate ?? item.purchaseOrder.createdAt).toISOString(),
        reference: `PO received: ${item.purchaseOrder.orderNumber}`,
        notes: null,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Compute running balance going backwards from current stock
    let balance = material.currentStock
    const movements: Movement[] = raw.map((m) => {
      const balanceAfter = balance
      balance = m.type === "IN" ? balance - m.quantity : balance + m.quantity
      return { ...m, balanceAfter }
    })

    return NextResponse.json({ material, movements })
  } catch (error) {
    console.error("[INVENTORY_MOVEMENTS]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
