import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TestType, TestResult } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const transformerId = searchParams.get("transformerId") ?? ""
    const result = searchParams.get("result") ?? ""
    const testType = searchParams.get("testType") ?? ""

    const tests = await prisma.qualityTest.findMany({
      where: {
        AND: [
          transformerId ? { transformerId } : {},
          result ? { result: result as TestResult } : {},
          testType ? { testType: testType as TestType } : {},
        ],
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
      orderBy: { testedAt: "desc" },
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error("[QUALITY_GET]", error)
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

    if (!transformerId || !testType || !result) {
      return NextResponse.json(
        { error: "transformerId, testType, and result are required" },
        { status: 400 }
      )
    }

    const transformer = await prisma.transformer.findUnique({
      where: { id: transformerId },
    })
    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    const test = await prisma.qualityTest.create({
      data: {
        transformerId,
        engineerId: session.user.id,
        testType: testType as TestType,
        result: result as TestResult,
        voltage: voltage ?? null,
        current: current ?? null,
        temperature: temperature ?? null,
        resistance: resistance ?? null,
        loadLoss: loadLoss ?? null,
        noLoadLoss: noLoadLoss ?? null,
        notes: notes ?? null,
        faultLog: faultLog ?? null,
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

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error("[QUALITY_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
