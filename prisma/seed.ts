import { PrismaClient, Role, MaterialCategory, PhaseType, ProductionStage, TransformerStatus, TestType, TestResult, DeliveryStatus, POStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Users ─────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@transformerco.in" },
    update: {},
    create: {
      email: "admin@transformerco.in",
      password: hashedPassword,
      name: "Rajinder Singh",
      role: Role.SUPER_ADMIN,
    },
  })

  const prodManager = await prisma.user.upsert({
    where: { email: "production@transformerco.in" },
    update: {},
    create: {
      email: "production@transformerco.in",
      password: hashedPassword,
      name: "Harpreet Kaur",
      role: Role.PRODUCTION_MANAGER,
    },
  })

  const inventoryManager = await prisma.user.upsert({
    where: { email: "inventory@transformerco.in" },
    update: {},
    create: {
      email: "inventory@transformerco.in",
      password: hashedPassword,
      name: "Gurdeep Sharma",
      role: Role.INVENTORY_MANAGER,
    },
  })

  const qualityEngineer = await prisma.user.upsert({
    where: { email: "quality@transformerco.in" },
    update: {},
    create: {
      email: "quality@transformerco.in",
      password: hashedPassword,
      name: "Manpreet Gill",
      role: Role.QUALITY_ENGINEER,
    },
  })

  const dispatchStaff = await prisma.user.upsert({
    where: { email: "dispatch@transformerco.in" },
    update: {},
    create: {
      email: "dispatch@transformerco.in",
      password: hashedPassword,
      name: "Sukhwinder Sandhu",
      role: Role.DISPATCH_STAFF,
    },
  })

  console.log("✅ Users created")

  // ─── Vendors ────────────────────────────────────────────────────────────────
  const vendor1 = await prisma.vendor.create({
    data: {
      name: "Punjab Copper Industries Ltd.",
      email: "sales@punjabcopper.com",
      phone: "+91-98140-12345",
      address: "Industrial Area Phase 8, Mohali, Punjab 160071",
      gstNumber: "03AABCP1234A1Z5",
    },
  })

  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Bharat Steel & Core Pvt. Ltd.",
      email: "orders@bharatsteel.co.in",
      phone: "+91-98760-54321",
      address: "Sector 12, Faridabad, Haryana 121007",
      gstNumber: "06AABCB5678B1Z3",
    },
  })

  const vendor3 = await prisma.vendor.create({
    data: {
      name: "National Insulation & Electrical Co.",
      email: "procurement@nationalins.com",
      phone: "+91-97290-98765",
      address: "GIDC Estate, Vatva, Ahmedabad, Gujarat 382445",
      gstNumber: "24AABCN9012C1Z1",
    },
  })

  const vendor4 = await prisma.vendor.create({
    data: {
      name: "Hindustan Oil & Fluids Pvt. Ltd.",
      email: "supply@hindoil.in",
      phone: "+91-99150-11223",
      address: "Peenya Industrial Area, Bengaluru, Karnataka 560058",
      gstNumber: "29AABCH3456D1Z9",
    },
  })

  console.log("✅ Vendors created")

  // ─── Raw Materials ───────────────────────────────────────────────────────────
  const mat1 = await prisma.rawMaterial.create({
    data: {
      name: "Copper Winding Wire (10 SWG)",
      category: MaterialCategory.COPPER_COIL,
      currentStock: 480,
      unit: "kg",
      minimumStock: 100,
      unitPrice: 850,
      location: "Warehouse A - Rack 1",
      description: "Enameled copper wire, Grade 2 insulation, 10 SWG",
      vendorId: vendor1.id,
    },
  })

  const mat2 = await prisma.rawMaterial.create({
    data: {
      name: "Copper Winding Wire (14 SWG)",
      category: MaterialCategory.COPPER_COIL,
      currentStock: 7,
      unit: "kg",
      minimumStock: 50,
      unitPrice: 870,
      location: "Warehouse A - Rack 2",
      description: "Enameled copper wire, Grade 2 insulation, 14 SWG",
      vendorId: vendor1.id,
    },
  })

  const mat3 = await prisma.rawMaterial.create({
    data: {
      name: "CRGO Silicon Steel Lamination (M4)",
      category: MaterialCategory.CRGO_STEEL,
      currentStock: 3200,
      unit: "kg",
      minimumStock: 500,
      unitPrice: 145,
      location: "Warehouse B - Section 1",
      description: "Cold rolled grain oriented, 0.27mm, M4 grade",
      vendorId: vendor2.id,
    },
  })

  const mat4 = await prisma.rawMaterial.create({
    data: {
      name: "Transformer Oil (IS 335 Grade)",
      category: MaterialCategory.TRANSFORMER_OIL,
      currentStock: 4,
      unit: "drums",
      minimumStock: 10,
      unitPrice: 12500,
      location: "Oil Storage - Tank 1",
      description: "Mineral insulating oil, uninhibited, IS 335 grade",
      vendorId: vendor4.id,
    },
  })

  const mat5 = await prisma.rawMaterial.create({
    data: {
      name: "HV Porcelain Bushing 11kV",
      category: MaterialCategory.BUSHINGS,
      currentStock: 24,
      unit: "pcs",
      minimumStock: 12,
      unitPrice: 2200,
      location: "Warehouse C - Shelf 3",
      description: "Outdoor type, 400A rated, 11kV porcelain bushing",
      vendorId: vendor3.id,
    },
  })

  const mat6 = await prisma.rawMaterial.create({
    data: {
      name: "LV Bushing 415V",
      category: MaterialCategory.BUSHINGS,
      currentStock: 48,
      unit: "pcs",
      minimumStock: 20,
      unitPrice: 480,
      location: "Warehouse C - Shelf 4",
      description: "Indoor, epoxy resin, 415V LV bushing",
      vendorId: vendor3.id,
    },
  })

  const mat7 = await prisma.rawMaterial.create({
    data: {
      name: "Kraft Paper Insulation (0.5mm)",
      category: MaterialCategory.INSULATION,
      currentStock: 8,
      unit: "rolls",
      minimumStock: 15,
      unitPrice: 3400,
      location: "Warehouse A - Rack 5",
      description: "0.5mm thick, 1m width, high-voltage kraft paper",
      vendorId: vendor3.id,
    },
  })

  const mat8 = await prisma.rawMaterial.create({
    data: {
      name: "Pressboard Sheet (2mm)",
      category: MaterialCategory.INSULATION,
      currentStock: 4,
      unit: "sheets",
      minimumStock: 20,
      unitPrice: 1800,
      location: "Warehouse A - Rack 6",
      description: "HV barrier board, 2mm thick, 1.2m x 2.4m",
      vendorId: vendor3.id,
    },
  })

  const mat9 = await prisma.rawMaterial.create({
    data: {
      name: "Core Frame Assembly (100kVA)",
      category: MaterialCategory.CORE_FRAME,
      currentStock: 15,
      unit: "sets",
      minimumStock: 5,
      unitPrice: 8500,
      location: "Production Floor - Store 1",
      description: "Pre-fabricated core frame set for 100kVA transformers",
      vendorId: vendor2.id,
    },
  })

  const mat10 = await prisma.rawMaterial.create({
    data: {
      name: "Off-Circuit Tap Changer (11kV)",
      category: MaterialCategory.TAPPING_SWITCH,
      currentStock: 18,
      unit: "pcs",
      minimumStock: 8,
      unitPrice: 4200,
      location: "Warehouse C - Shelf 1",
      description: "Off-circuit tap changer, 5 position, 11kV HV side",
      vendorId: vendor3.id,
    },
  })

  const mat11 = await prisma.rawMaterial.create({
    data: {
      name: "Corrugated Fin Radiator (800mm)",
      category: MaterialCategory.COOLING_RADIATOR,
      currentStock: 32,
      unit: "panels",
      minimumStock: 10,
      unitPrice: 2800,
      location: "Warehouse B - Section 3",
      description: "CRCA steel, 3-pass corrugated fin, 800mm height",
      vendorId: vendor2.id,
    },
  })

  const mat12 = await prisma.rawMaterial.create({
    data: {
      name: "Plywood Packing Cases",
      category: MaterialCategory.PACKAGING,
      currentStock: 6,
      unit: "pcs",
      minimumStock: 8,
      unitPrice: 3500,
      location: "Dispatch Area",
      description: "Custom plywood packing cases for 100-630 kVA",
      vendorId: vendor3.id,
    },
  })

  console.log("✅ Raw materials created")

  // ─── Purchase Orders ─────────────────────────────────────────────────────────
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-20260501-1001",
      status: POStatus.ORDERED,
      totalAmount: 214000,
      vendorId: vendor1.id,
      expectedDate: new Date("2026-05-25"),
      notes: "Urgent order for Q2 production schedule",
      items: {
        create: [
          { materialId: mat2.id, quantity: 200, unitPrice: 870, totalPrice: 174000 },
          { materialId: mat1.id, quantity: 40, unitPrice: 850, totalPrice: 34000 },
        ],
      },
    },
  })

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-20260502-1002",
      status: POStatus.APPROVED,
      totalAmount: 125000,
      vendorId: vendor3.id,
      expectedDate: new Date("2026-05-28"),
      notes: "Insulation materials restock",
      items: {
        create: [
          { materialId: mat7.id, quantity: 20, unitPrice: 3400, totalPrice: 68000 },
          { materialId: mat8.id, quantity: 25, unitPrice: 1800, totalPrice: 45000 },
          { materialId: mat12.id, quantity: 3, unitPrice: 3500, totalPrice: 10500 },
        ],
      },
    },
  })

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-20260428-1000",
      status: POStatus.RECEIVED,
      totalAmount: 250000,
      vendorId: vendor4.id,
      expectedDate: new Date("2026-05-05"),
      receivedDate: new Date("2026-05-04"),
      notes: "Oil supply for Q2",
      items: {
        create: [
          { materialId: mat4.id, quantity: 20, unitPrice: 12500, totalPrice: 250000 },
        ],
      },
    },
  })

  console.log("✅ Purchase orders created")

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const client1 = await prisma.client.create({
    data: {
      name: "Punjab State Power Corporation Ltd.",
      email: "procurement@pspcl.in",
      phone: "+91-161-2401234",
      address: "PSPCL Head Office, The Mall, Patiala, Punjab 147001",
      gstNumber: "03AABCP5678E1Z2",
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: "Haryana Vidyut Prasaran Nigam",
      email: "purchase@hvpn.in",
      phone: "+91-172-2701456",
      address: "Shakti Bhawan, Sector 6, Panchkula, Haryana 134109",
      gstNumber: "06AABCH7890F1Z8",
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: "Ludhiana Steel Rolling Mills",
      email: "admin@ludhianasteel.com",
      phone: "+91-98140-77890",
      address: "Focal Point, Phase IV, Ludhiana, Punjab 141010",
      gstNumber: "03AABCL2345G1Z4",
    },
  })

  console.log("✅ Clients created")

  // ─── Transformers ─────────────────────────────────────────────────────────────
  const now = new Date()

  const t1 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-100KVA-001",
      kvaRating: 100,
      voltageRatio: "11kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-05",
      currentStage: ProductionStage.QC_APPROVAL,
      status: TransformerStatus.IN_PRODUCTION,
      deadline: new Date("2026-05-22"),
      serialNumber: "SN-2026-0501",
      engineerId: qualityEngineer.id,
      clientId: client1.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-05-01"), exitedAt: new Date("2026-05-02"), completedBy: prodManager.name },
          { stage: ProductionStage.ASSEMBLY, enteredAt: new Date("2026-05-02"), exitedAt: new Date("2026-05-05"), completedBy: prodManager.name },
          { stage: ProductionStage.COIL_WINDING, enteredAt: new Date("2026-05-05"), exitedAt: new Date("2026-05-09"), completedBy: prodManager.name },
          { stage: ProductionStage.CORE_ASSEMBLY, enteredAt: new Date("2026-05-09"), exitedAt: new Date("2026-05-12"), completedBy: prodManager.name },
          { stage: ProductionStage.OIL_FILLING, enteredAt: new Date("2026-05-12"), exitedAt: new Date("2026-05-13"), completedBy: prodManager.name },
          { stage: ProductionStage.TESTING, enteredAt: new Date("2026-05-13"), exitedAt: new Date("2026-05-15"), completedBy: qualityEngineer.name },
          { stage: ProductionStage.QC_APPROVAL, enteredAt: new Date("2026-05-15"), completedBy: qualityEngineer.name },
        ],
      },
    },
  })

  const t2 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-250KVA-002",
      kvaRating: 250,
      voltageRatio: "33kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-05",
      currentStage: ProductionStage.COIL_WINDING,
      status: TransformerStatus.IN_PRODUCTION,
      deadline: new Date("2026-05-30"),
      serialNumber: "SN-2026-0502",
      engineerId: prodManager.id,
      clientId: client2.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-05-03"), exitedAt: new Date("2026-05-04"), completedBy: prodManager.name },
          { stage: ProductionStage.ASSEMBLY, enteredAt: new Date("2026-05-04"), exitedAt: new Date("2026-05-08"), completedBy: prodManager.name },
          { stage: ProductionStage.COIL_WINDING, enteredAt: new Date("2026-05-08"), completedBy: prodManager.name },
        ],
      },
    },
  })

  const t3 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-500KVA-003",
      kvaRating: 500,
      voltageRatio: "33kV/433V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-04",
      currentStage: ProductionStage.DISPATCH_READY,
      status: TransformerStatus.COMPLETED,
      deadline: new Date("2026-05-10"),
      completedAt: new Date("2026-05-09"),
      serialNumber: "SN-2026-0401",
      engineerId: qualityEngineer.id,
      clientId: client1.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-04-15"), exitedAt: new Date("2026-04-16"), completedBy: prodManager.name },
          { stage: ProductionStage.ASSEMBLY, enteredAt: new Date("2026-04-16"), exitedAt: new Date("2026-04-20"), completedBy: prodManager.name },
          { stage: ProductionStage.COIL_WINDING, enteredAt: new Date("2026-04-20"), exitedAt: new Date("2026-04-26"), completedBy: prodManager.name },
          { stage: ProductionStage.CORE_ASSEMBLY, enteredAt: new Date("2026-04-26"), exitedAt: new Date("2026-04-30"), completedBy: prodManager.name },
          { stage: ProductionStage.OIL_FILLING, enteredAt: new Date("2026-04-30"), exitedAt: new Date("2026-05-01"), completedBy: prodManager.name },
          { stage: ProductionStage.TESTING, enteredAt: new Date("2026-05-01"), exitedAt: new Date("2026-05-06"), completedBy: qualityEngineer.name },
          { stage: ProductionStage.QC_APPROVAL, enteredAt: new Date("2026-05-06"), exitedAt: new Date("2026-05-08"), completedBy: qualityEngineer.name },
          { stage: ProductionStage.DISPATCH_READY, enteredAt: new Date("2026-05-08"), exitedAt: new Date("2026-05-09"), completedBy: dispatchStaff.name },
        ],
      },
    },
  })

  const t4 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-63KVA-004",
      kvaRating: 63,
      voltageRatio: "11kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-05",
      currentStage: ProductionStage.ASSEMBLY,
      status: TransformerStatus.IN_PRODUCTION,
      deadline: new Date("2026-06-05"),
      serialNumber: "SN-2026-0503",
      engineerId: prodManager.id,
      clientId: client3.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-05-10"), exitedAt: new Date("2026-05-11"), completedBy: prodManager.name },
          { stage: ProductionStage.ASSEMBLY, enteredAt: new Date("2026-05-11"), completedBy: prodManager.name },
        ],
      },
    },
  })

  const t5 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-160KVA-005",
      kvaRating: 160,
      voltageRatio: "11kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-04",
      currentStage: ProductionStage.DISPATCH_READY,
      status: TransformerStatus.DISPATCHED,
      deadline: new Date("2026-04-30"),
      completedAt: new Date("2026-04-28"),
      serialNumber: "SN-2026-0402",
      engineerId: qualityEngineer.id,
      clientId: client2.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-04-01"), exitedAt: new Date("2026-04-02"), completedBy: prodManager.name },
          { stage: ProductionStage.ASSEMBLY, enteredAt: new Date("2026-04-02"), exitedAt: new Date("2026-04-07"), completedBy: prodManager.name },
          { stage: ProductionStage.COIL_WINDING, enteredAt: new Date("2026-04-07"), exitedAt: new Date("2026-04-14"), completedBy: prodManager.name },
          { stage: ProductionStage.CORE_ASSEMBLY, enteredAt: new Date("2026-04-14"), exitedAt: new Date("2026-04-18"), completedBy: prodManager.name },
          { stage: ProductionStage.OIL_FILLING, enteredAt: new Date("2026-04-18"), exitedAt: new Date("2026-04-19"), completedBy: prodManager.name },
          { stage: ProductionStage.TESTING, enteredAt: new Date("2026-04-19"), exitedAt: new Date("2026-04-23"), completedBy: qualityEngineer.name },
          { stage: ProductionStage.QC_APPROVAL, enteredAt: new Date("2026-04-23"), exitedAt: new Date("2026-04-25"), completedBy: qualityEngineer.name },
          { stage: ProductionStage.DISPATCH_READY, enteredAt: new Date("2026-04-25"), exitedAt: new Date("2026-04-28"), completedBy: dispatchStaff.name },
        ],
      },
    },
  })

  const t6 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-315KVA-006",
      kvaRating: 315,
      voltageRatio: "33kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-05",
      currentStage: ProductionStage.RAW_MATERIAL_RECEIVED,
      status: TransformerStatus.IN_PRODUCTION,
      deadline: new Date("2026-06-15"),
      serialNumber: "SN-2026-0504",
      engineerId: prodManager.id,
      clientId: client1.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.RAW_MATERIAL_RECEIVED, enteredAt: new Date("2026-05-14"), completedBy: inventoryManager.name },
        ],
      },
    },
  })

  const t7 = await prisma.transformer.create({
    data: {
      modelNumber: "TRF-100KVA-007",
      kvaRating: 100,
      voltageRatio: "11kV/415V",
      phaseType: PhaseType.THREE_PHASE,
      batchNumber: "BATCH-2026-03",
      currentStage: ProductionStage.DISPATCH_READY,
      status: TransformerStatus.DISPATCHED,
      deadline: new Date("2026-03-31"),
      completedAt: new Date("2026-03-29"),
      serialNumber: "SN-2026-0301",
      engineerId: qualityEngineer.id,
      clientId: client3.id,
      stageHistory: {
        create: [
          { stage: ProductionStage.DISPATCH_READY, enteredAt: new Date("2026-03-25"), exitedAt: new Date("2026-03-30"), completedBy: dispatchStaff.name },
        ],
      },
    },
  })

  console.log("✅ Transformers created")

  // ─── Quality Tests ────────────────────────────────────────────────────────────
  await prisma.qualityTest.createMany({
    data: [
      {
        transformerId: t1.id,
        engineerId: qualityEngineer.id,
        testType: TestType.VOLTAGE_TEST,
        result: TestResult.PASS,
        voltage: 12100,
        current: 5.2,
        notes: "Voltage withstand test passed at 28kV for 1 minute",
        testedAt: new Date("2026-05-13T10:00:00"),
      },
      {
        transformerId: t1.id,
        engineerId: qualityEngineer.id,
        testType: TestType.INSULATION_RESISTANCE,
        result: TestResult.PASS,
        resistance: 2500,
        notes: "IR value 2500 MΩ, well above 500 MΩ minimum",
        testedAt: new Date("2026-05-13T11:30:00"),
      },
      {
        transformerId: t1.id,
        engineerId: qualityEngineer.id,
        testType: TestType.LOAD_TEST,
        result: TestResult.PASS,
        voltage: 415,
        current: 139.1,
        loadLoss: 1250,
        noLoadLoss: 210,
        notes: "Load loss within IS 2026 limits",
        testedAt: new Date("2026-05-14T09:00:00"),
      },
      {
        transformerId: t1.id,
        engineerId: qualityEngineer.id,
        testType: TestType.TEMPERATURE_RISE,
        result: TestResult.PASS,
        temperature: 62.5,
        notes: "Temperature rise 62.5°C, within 65°C limit",
        testedAt: new Date("2026-05-14T14:00:00"),
      },
      {
        transformerId: t1.id,
        engineerId: qualityEngineer.id,
        testType: TestType.TURNS_RATIO,
        result: TestResult.PASS,
        voltage: 11000,
        notes: "Turns ratio 26.54:1, tolerance ±0.5% OK",
        testedAt: new Date("2026-05-15T09:00:00"),
      },
      {
        transformerId: t3.id,
        engineerId: qualityEngineer.id,
        testType: TestType.VOLTAGE_TEST,
        result: TestResult.PASS,
        voltage: 36300,
        current: 8.7,
        notes: "HV winding test 70kV, LV winding test 3kV, all passed",
        testedAt: new Date("2026-05-01T10:00:00"),
      },
      {
        transformerId: t3.id,
        engineerId: qualityEngineer.id,
        testType: TestType.LOAD_TEST,
        result: TestResult.PASS,
        loadLoss: 2800,
        noLoadLoss: 520,
        notes: "Losses within guaranteed values",
        testedAt: new Date("2026-05-02T10:00:00"),
      },
      {
        transformerId: t3.id,
        engineerId: qualityEngineer.id,
        testType: TestType.FINAL_QC,
        result: TestResult.PASS,
        notes: "All parameters meet IS 2026 requirements. Approved for dispatch.",
        testedAt: new Date("2026-05-08T15:00:00"),
      },
      {
        transformerId: t5.id,
        engineerId: qualityEngineer.id,
        testType: TestType.FINAL_QC,
        result: TestResult.PASS,
        notes: "Final QC approved. All tests cleared.",
        testedAt: new Date("2026-04-25T14:00:00"),
      },
    ],
  })

  console.log("✅ Quality tests created")

  // ─── Material Usage ───────────────────────────────────────────────────────────
  await prisma.materialUsage.createMany({
    data: [
      { materialId: mat1.id, transformerId: t1.id, quantity: 85, notes: "HV and LV winding coils", usedAt: new Date("2026-05-06") },
      { materialId: mat3.id, transformerId: t1.id, quantity: 320, notes: "Core lamination stack", usedAt: new Date("2026-05-09") },
      { materialId: mat5.id, transformerId: t1.id, quantity: 3, notes: "HV bushings installed", usedAt: new Date("2026-05-12") },
      { materialId: mat6.id, transformerId: t1.id, quantity: 4, notes: "LV bushings installed", usedAt: new Date("2026-05-12") },
      { materialId: mat1.id, transformerId: t3.id, quantity: 210, notes: "HV winding", usedAt: new Date("2026-04-21") },
      { materialId: mat3.id, transformerId: t3.id, quantity: 780, notes: "Core assembly", usedAt: new Date("2026-04-27") },
      { materialId: mat4.id, transformerId: t3.id, quantity: 2, notes: "Oil filling — 2 drums", usedAt: new Date("2026-05-01") },
      { materialId: mat5.id, transformerId: t3.id, quantity: 3, notes: "33kV HV bushings", usedAt: new Date("2026-05-02") },
      { materialId: mat1.id, transformerId: t5.id, quantity: 130, notes: "Coil winding", usedAt: new Date("2026-04-08") },
      { materialId: mat3.id, transformerId: t5.id, quantity: 480, notes: "Core lamination", usedAt: new Date("2026-04-15") },
    ],
  })

  console.log("✅ Material usage recorded")

  // ─── Dispatches ───────────────────────────────────────────────────────────────
  await prisma.dispatch.create({
    data: {
      transformerId: t3.id,
      clientId: client1.id,
      dispatchedById: dispatchStaff.id,
      invoiceNumber: "INV-20260509-4001",
      invoiceAmount: 485000,
      paidAmount: 485000,
      dispatchDate: new Date("2026-05-09"),
      deliveryStatus: DeliveryStatus.DELIVERED,
      deliveryAddress: "PSPCL 33/11kV Sub-Station, Patiala, Punjab",
      transporterName: "Sharma Transport Co.",
      trackingNumber: "STC-2026-9812",
      notes: "Delivered and commissioned successfully",
    },
  })

  await prisma.dispatch.create({
    data: {
      transformerId: t5.id,
      clientId: client2.id,
      dispatchedById: dispatchStaff.id,
      invoiceNumber: "INV-20260428-4002",
      invoiceAmount: 198000,
      paidAmount: 100000,
      dispatchDate: new Date("2026-04-28"),
      deliveryStatus: DeliveryStatus.DELIVERED,
      deliveryAddress: "HVPN 11kV Sub-Station, Ambala, Haryana",
      transporterName: "Punjab Roadways Pvt. Ltd.",
      trackingNumber: "PR-2026-7734",
      notes: "Partial payment received. Balance due by 31 May.",
    },
  })

  await prisma.dispatch.create({
    data: {
      transformerId: t7.id,
      clientId: client3.id,
      dispatchedById: dispatchStaff.id,
      invoiceNumber: "INV-20260330-4003",
      invoiceAmount: 145000,
      paidAmount: 145000,
      dispatchDate: new Date("2026-03-30"),
      deliveryStatus: DeliveryStatus.DELIVERED,
      deliveryAddress: "Ludhiana Steel Rolling Mills, Focal Point, Ludhiana",
      transporterName: "Om Shanti Carriers",
      trackingNumber: "OSC-2026-4421",
      notes: "Delivered and full payment cleared",
    },
  })

  // Update dispatched transformer statuses
  await prisma.transformer.updateMany({
    where: { id: { in: [t5.id, t7.id] } },
    data: { status: TransformerStatus.DISPATCHED },
  })

  console.log("✅ Dispatches created")

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database seeded successfully!

Login credentials (all use password: admin123):

  Super Admin      → admin@transformerco.in
  Production Mgr   → production@transformerco.in
  Inventory Mgr    → inventory@transformerco.in
  Quality Engineer → quality@transformerco.in
  Dispatch Staff   → dispatch@transformerco.in

Summary:
  Users: 5  |  Vendors: 4  |  Materials: 12
  Transformers: 7  |  POs: 3  |  Dispatches: 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
