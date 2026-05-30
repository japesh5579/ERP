import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const showAll = searchParams.get("all") === "true"

    const vendors = await prisma.vendor.findMany({
      where: showAll ? {} : { active: true },
      include: {
        _count: {
          select: { materials: true, purchaseOrders: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error("[VENDORS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, email, phone, address, gstNumber } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        gstNumber: gstNumber ?? null,
        active: true,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error("[VENDORS_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
