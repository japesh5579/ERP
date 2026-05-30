import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TestType, TestResult } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const test = await prisma.qualityTest.findUnique({
      where: { id },
      include: {
        transformer: {
          select: {
            id: true,
            modelNumber: true,
            serialNumber: true,
            kvaRating: true,
            voltageRatio: true,
            currentStage: true,
            status: true,
          },
        },
        engineer: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!test) {
      return NextResponse.json({ error: "Quality test not found" }, { status: 404 })
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error("[QUALITY_ID_GET]", error)
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

    const existing = await prisma.qualityTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Quality test not found" }, { status: 404 })
    }

    const {
      testType,
      result,
      voltage,
      current,
      temperature,
      resistance,
      loadLoss,
      noLoadLoss,
      notes,
      faultLog,
    } = body

    const updated = await prisma.qualityTest.update({
      where: { id },
      data: {
        ...(testType !== undefined && { testType: testType as TestType }),
        ...(result !== undefined && { result: result as TestResult }),
        ...(voltage !== undefined && { voltage }),
        ...(current !== undefined && { current }),
        ...(temperature !== undefined && { temperature }),
        ...(resistance !== undefined && { resistance }),
        ...(loadLoss !== undefined && { loadLoss }),
        ...(noLoadLoss !== undefined && { noLoadLoss }),
        ...(notes !== undefined && { notes }),
        ...(faultLog !== undefined && { faultLog }),
      },
      include: {
        transformer: {
          select: {
            id: true,
            modelNumber: true,
            serialNumber: true,
            currentStage: true,
            status: true,
          },
        },
        engineer: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[QUALITY_ID_PATCH]", error)
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

    const existing = await prisma.qualityTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Quality test not found" }, { status: 404 })
    }

    await prisma.qualityTest.delete({ where: { id } })

    return NextResponse.json({ message: "Quality test deleted successfully" })
  } catch (error) {
    console.error("[QUALITY_ID_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
