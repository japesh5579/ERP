import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Reuse client in dev to avoid exhausting connections on hot reload.
// In production (Vercel serverless), each function instance has its own client.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
