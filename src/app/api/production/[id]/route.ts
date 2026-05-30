import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PhaseType, TransformerStatus, ProductionStage } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const transformer = await prisma.transformer.findUnique({
      where: { id },
      include: {
        engineer: { select: { id: true, name: true, email: true, role: true } },
        client: true,
        stageHistory: { orderBy: { enteredAt: "desc" } },
        qualityTests: {
          orderBy: { testedAt: "desc" },
          include: {
            engineer: { select: { id: true, name: true, email: true } },
          },
        },
        materialUsages: {
          orderBy: { usedAt: "desc" },
          include: {
            material: {
              select: { id: true, name: true, unit: true, category: true },
            },
          },
        },
        dispatch: {
          include: {
            client: true,
            dispatchedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    return NextResponse.json(transformer)
  } catch (error) {
    console.error("[PRODUCTION_ID_GET]", error)
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

    const existing = await prisma.transformer.findUnique({
      where: { id },
      include: {
        stageHistory: {
          where: { exitedAt: null },
          orderBy: { enteredAt: "desc" },
          take: 1,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    const {
      modelNumber,
      kvaRating,
      voltageRatio,
      phaseType,
      batchNumber,
      currentStage,
      status,
      deadline,
      engineerId,
      clientId,
      serialNumber,
      notes,
      stageNotes,
    } = body

    const stageChanging =
      currentStage !== undefined && currentStage !== existing.currentStage

    // Build update data
    const updateData: Record<string, unknown> = {
      ...(modelNumber !== undefined && { modelNumber }),
      ...(kvaRating !== undefined && { kvaRating }),
      ...(voltageRatio !== undefined && { voltageRatio }),
      ...(phaseType !== undefined && { phaseType: phaseType as PhaseType }),
      ...(batchNumber !== undefined && { batchNumber }),
      ...(currentStage !== undefined && { currentStage: currentStage as ProductionStage }),
      ...(status !== undefined && { status: status as TransformerStatus }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(engineerId !== undefined && { engineerId: engineerId ?? null }),
      ...(clientId !== undefined && { clientId: clientId ?? null }),
      ...(serialNumber !== undefined && { serialNumber }),
      ...(notes !== undefined && { notes }),
    }

    // If status is being set to COMPLETED, record completedAt
    if (status === "COMPLETED" && existing.status !== "COMPLETED") {
      updateData.completedAt = new Date()
    }

    let transformer

    if (stageChanging) {
      // Use a transaction to close old stage entry and open new one
      transformer = await prisma.$transaction(async (tx) => {
        // Close the current open stage history entry
        if (existing.stageHistory.length > 0) {
          await tx.stageHistory.update({
            where: { id: existing.stageHistory[0].id },
            data: {
              exitedAt: new Date(),
              notes: stageNotes ?? null,
              completedBy: session.user.id,
            },
          })
        }

        // Create new stage history entry
        await tx.stageHistory.create({
          data: {
            transformerId: id,
            stage: currentStage as ProductionStage,
            enteredAt: new Date(),
            completedBy: session.user.id,
          },
        })

        // Update the transformer
        return tx.transformer.update({
          where: { id },
          data: updateData,
          include: {
            engineer: { select: { id: true, name: true, email: true, role: true } },
            client: { select: { id: true, name: true, email: true, phone: true } },
            stageHistory: { orderBy: { enteredAt: "desc" } },
          },
        })
      })
    } else {
      transformer = await prisma.transformer.update({
        where: { id },
        data: updateData,
        include: {
          engineer: { select: { id: true, name: true, email: true, role: true } },
          client: { select: { id: true, name: true, email: true, phone: true } },
          stageHistory: { orderBy: { enteredAt: "desc" } },
        },
      })
    }

    return NextResponse.json(transformer)
  } catch (error) {
    console.error("[PRODUCTION_ID_PATCH]", error)
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

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: SUPER_ADMIN only" }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.transformer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    await prisma.transformer.delete({ where: { id } })

    return NextResponse.json({ message: "Transformer deleted successfully" })
  } catch (error) {
    console.error("[PRODUCTION_ID_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
