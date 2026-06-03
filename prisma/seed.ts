import { PrismaClient, Role, MaterialCategory, PhaseType, ProductionStage, TransformerStatus, TestType, TestResult, DeliveryStatus, POStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const hashedPassword = await bcrypt.hash("admin123", 10)

  // ─── Users ────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@transformerco.in" },
    update: {},
    create: {
      email: "admin@transformerco.in",
      password: hashedPassword,
      name: "Rajinder Singh",
      role: Role.ADMIN,
    },
  })

  const worker1 = await prisma.user.upsert({
    where: { email: "worker1@transformerco.in" },
    update: {},
    create: {
      email: "worker1@transformerco.in",
      password: hashedPassword,
      name: "Harpreet Kaur",
      role: Role.WORKER,
    },
  })

  const worker2 = await prisma.user.upsert({
    where: { email: "worker2@transformerco.in" },
    update: {},
    create: {
      email: "worker2@transformerco.in",
      password: hashedPassword,
      name: "Gurdeep Sharma",
      role: Role.WORKER,
    },
  })

  const worker3 = await prisma.user.upsert({
    where: { email: "worker3@transformerco.in" },
    update: {},
    create: {
      email: "worker3@transformerco.in",
      password: hashedPassword,
      name: "Manpreet Gill",
      role: Role.WORKER,
    },
  })

  const worker4 = await prisma.user.upsert({
    where: { email: "worker4@transformerco.in" },
    update: {},
    create: {
      email: "worker4@transformerco.in",
      password: hashedPassword,
      name: "Sukhwinder Sandhu",
      role: Role.WORKER,
    },
  })

  const worker5 = await prisma.user.upsert({
    where: { email: "worker5@transformerco.in" },
    update: {},
    create: {
      email: "worker5@transformerco.in",
      password: hashedPassword,
      name: "Balwinder Singh",
      role: Role.WORKER,
    },
  })

  const worker6 = await prisma.user.upsert({
    where: { email: "worker6@transformerco.in" },
    update: {},
    create: {
      email: "worker6@transformerco.in",
      password: hashedPassword,
      name: "Paramjit Kaur",
      role: Role.WORKER,
    },
  })

  const worker7 = await prisma.user.upsert({
    where: { email: "worker7@transformerco.in" },
    update: {},
    create: {
      email: "worker7@transformerco.in",
      password: hashedPassword,
      name: "Jaswinder Sidhu",
      role: Role.WORKER,
    },
  })

  const worker8 = await prisma.user.upsert({
    where: { email: "worker8@transformerco.in" },
    update: {},
    create: {
      email: "worker8@transformerco.in",
      password: hashedPassword,
      name: "Kulwant Rai",
      role: Role.WORKER,
    },
  })

  console.log("✅ Users created (1 admin + 8 workers)")

  // ─── Vendors ──────────────────────────────────────────────────────────────────
  const vendor1 = await prisma.vendor.upsert({
    where: { id: "vendor-1" },
    update: {},
    create: {
      id: "vendor-1",
      name: "Punjab Copper Industries Ltd.",
      email: "sales@punjabcopper.com",
      phone: "+91-98140-12345",
      address: "Industrial Area Phase 8, Mohali, Punjab 160071",
      gstNumber: "03AABCP1234A1Z5",
    },
  }).catch(() => prisma.vendor.create({
    data: {
      name: "Punjab Copper Industries Ltd.",
      email: "sales@punjabcopper.com",
      phone: "+91-98140-12345",
      address: "Industrial Area Phase 8, Mohali, Punjab 160071",
      gstNumber: "03AABCP1234A1Z5",
    },
  }))

  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Bharat Steel & Core Pvt. Ltd.",
      email: "orders@bharatsteel.co.in",
      phone: "+91-98760-54321",
      address: "Sector 12, Faridabad, Haryana 121007",
      gstNumber: "06AABCB5678B1Z3",
    },
  }).catch(() => prisma.vendor.findFirst({ where: { email: "orders@bharatsteel.co.in" } }) as any)

  const vendor3 = await prisma.vendor.create({
    data: {
      name: "National Insulation & Electrical Co.",
      email: "procurement@nationalins.com",
      phone: "+91-97290-98765",
      address: "GIDC Estate, Vatva, Ahmedabad, Gujarat 382445",
      gstNumber: "24AABCN9012C1Z1",
    },
  }).catch(() => prisma.vendor.findFirst({ where: { email: "procurement@nationalins.com" } }) as any)

  const vendor4 = await prisma.vendor.create({
    data: {
      name: "Hindustan Oil & Fluids Pvt. Ltd.",
      email: "supply@hindoil.in",
      phone: "+91-99150-11223",
      address: "Peenya Industrial Area, Bengaluru, Karnataka 560058",
      gstNumber: "29AABCH3456D1Z9",
    },
  }).catch(() => prisma.vendor.findFirst({ where: { email: "supply@hindoil.in" } }) as any)

  console.log("✅ Vendors ready")

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database seeded successfully!

Login credentials (all use password: admin123):

  Admin        → admin@transformerco.in
  Worker 1     → worker1@transformerco.in  (Harpreet Kaur)
  Worker 2     → worker2@transformerco.in  (Gurdeep Sharma)
  Worker 3     → worker3@transformerco.in  (Manpreet Gill)
  Worker 4     → worker4@transformerco.in  (Sukhwinder Sandhu)
  Worker 5     → worker5@transformerco.in  (Balwinder Singh)
  Worker 6     → worker6@transformerco.in  (Paramjit Kaur)
  Worker 7     → worker7@transformerco.in  (Jaswinder Sidhu)
  Worker 8     → worker8@transformerco.in  (Kulwant Rai)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
