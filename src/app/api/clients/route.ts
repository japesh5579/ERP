import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""

    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { name: "asc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("[CLIENTS_GET]", error)
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

    const client = await prisma.client.create({
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        gstNumber: gstNumber ?? null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("[CLIENTS_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
