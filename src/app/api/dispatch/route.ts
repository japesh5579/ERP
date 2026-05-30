import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/utils"
import { DeliveryStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? ""

    const dispatches = await prisma.dispatch.findMany({
      where: {
        ...(status ? { deliveryStatus: status as DeliveryStatus } : {}),
      },
      include: {
        transformer: {
          select: {
            id: true,
            modelNumber: true,
            serialNumber: true,
            kvaRating: true,
            voltageRatio: true,
            phaseType: true,
            status: true,
          },
        },
        client: { select: { id: true, name: true, email: true, phone: true } },
        dispatchedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(dispatches)
  } catch (error) {
    console.error("[DISPATCH_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      transformerId,
      clientId,
      invoiceAmount,
      deliveryAddress,
      transporterName,
      notes,
      trackingNumber,
      dispatchDate,
    } = body

    if (!transformerId || !clientId || invoiceAmount === undefined) {
      return NextResponse.json(
        { error: "transformerId, clientId, and invoiceAmount are required" },
        { status: 400 }
      )
    }

    const transformer = await prisma.transformer.findUnique({
      where: { id: transformerId },
    })
    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    if (transformer.status === "DISPATCHED") {
      return NextResponse.json(
        { error: "Transformer has already been dispatched" },
        { status: 409 }
      )
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const invoiceNumber = generateInvoiceNumber()

    const dispatch = await prisma.$transaction(async (tx) => {
      const newDispatch = await tx.dispatch.create({
        data: {
          transformerId,
          clientId,
          dispatchedById: session.user.id,
          invoiceNumber,
          invoiceAmount,
          deliveryAddress: deliveryAddress ?? null,
          transporterName: transporterName ?? null,
          trackingNumber: trackingNumber ?? null,
          dispatchDate: dispatchDate ? new Date(dispatchDate) : null,
          notes: notes ?? null,
          deliveryStatus: "PENDING",
          paidAmount: 0,
        },
        include: {
          transformer: {
            select: {
              id: true,
              modelNumber: true,
              serialNumber: true,
              kvaRating: true,
              voltageRatio: true,
            },
          },
          client: { select: { id: true, name: true, email: true, phone: true } },
          dispatchedBy: { select: { id: true, name: true, email: true } },
        },
      })

      await tx.transformer.update({
        where: { id: transformerId },
        data: { status: "DISPATCHED" },
      })

      return newDispatch
    })

    return NextResponse.json(dispatch, { status: 201 })
  } catch (error) {
    console.error("[DISPATCH_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
