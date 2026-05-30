import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DeliveryStatus } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        transformer: {
          select: {
            id: true,
            modelNumber: true,
            serialNumber: true,
            kvaRating: true,
            voltageRatio: true,
            phaseType: true,
            currentStage: true,
            status: true,
          },
        },
        client: true,
        dispatchedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!dispatch) {
      return NextResponse.json({ error: "Dispatch not found" }, { status: 404 })
    }

    return NextResponse.json(dispatch)
  } catch (error) {
    console.error("[DISPATCH_ID_GET]", error)
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

    const existing = await prisma.dispatch.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Dispatch not found" }, { status: 404 })
    }

    const { deliveryStatus, trackingNumber, paidAmount, dispatchDate, notes } = body

    const updated = await prisma.dispatch.update({
      where: { id },
      data: {
        ...(deliveryStatus !== undefined && {
          deliveryStatus: deliveryStatus as DeliveryStatus,
        }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(paidAmount !== undefined && { paidAmount }),
        ...(dispatchDate !== undefined && {
          dispatchDate: dispatchDate ? new Date(dispatchDate) : null,
        }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        transformer: {
          select: {
            id: true,
            modelNumber: true,
            serialNumber: true,
            kvaRating: true,
            voltageRatio: true,
            status: true,
          },
        },
        client: { select: { id: true, name: true, email: true, phone: true } },
        dispatchedBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[DISPATCH_ID_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
