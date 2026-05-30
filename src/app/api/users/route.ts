import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: SUPER_ADMIN only" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedTransformers: true,
            qualityTests: true,
            dispatches: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[USERS_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: SUPER_ADMIN only" }, { status: 403 })
    }

    const body = await req.json()
    const { email, name, password, role } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "email, name, and password are required" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: (role as Role) ?? "INVENTORY_MANAGER",
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[USERS_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
