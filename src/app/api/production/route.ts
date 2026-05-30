import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PhaseType, TransformerStatus, ProductionStage } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? ""
    const stage = searchParams.get("stage") ?? ""
    const search = searchParams.get("search") ?? ""

    const transformers = await prisma.transformer.findMany({
      where: {
        AND: [
          status ? { status: status as TransformerStatus } : {},
          stage ? { currentStage: stage as ProductionStage } : {},
          search
            ? {
                OR: [
                  { modelNumber: { contains: search, mode: "insensitive" } },
                  { serialNumber: { contains: search, mode: "insensitive" } },
                  { batchNumber: { contains: search, mode: "insensitive" } },
                  { voltageRatio: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        engineer: { select: { id: true, name: true, email: true, role: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { qualityTests: true, stageHistory: true, materialUsages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(transformers)
  } catch (error) {
    console.error("[PRODUCTION_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      modelNumber,
      kvaRating,
      voltageRatio,
      phaseType,
      batchNumber,
      deadline,
      engineerId,
      clientId,
      serialNumber,
      notes,
    } = body

    if (!modelNumber || !kvaRating || !voltageRatio) {
      return NextResponse.json(
        { error: "modelNumber, kvaRating, and voltageRatio are required" },
        { status: 400 }
      )
    }

    const transformer = await prisma.transformer.create({
      data: {
        modelNumber,
        kvaRating,
        voltageRatio,
        phaseType: (phaseType as PhaseType) ?? "THREE_PHASE",
        batchNumber: batchNumber ?? null,
        deadline: deadline ? new Date(deadline) : null,
        engineerId: engineerId ?? null,
        clientId: clientId ?? null,
        serialNumber: serialNumber ?? null,
        notes: notes ?? null,
        currentStage: "RAW_MATERIAL_RECEIVED",
        status: "IN_PRODUCTION",
        stageHistory: {
          create: {
            stage: "RAW_MATERIAL_RECEIVED",
            enteredAt: new Date(),
            completedBy: session.user.id,
          },
        },
      },
      include: {
        engineer: { select: { id: true, name: true, email: true, role: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
        stageHistory: { orderBy: { enteredAt: "desc" } },
      },
    })

    return NextResponse.json(transformer, { status: 201 })
  } catch (error) {
    console.error("[PRODUCTION_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
