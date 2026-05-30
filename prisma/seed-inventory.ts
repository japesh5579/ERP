import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const MATERIALS = [
  // ── CORE ──────────────────────────────────────────────────────────────────
  { name: "CRGO Silicon Steel Laminations",  category: "CRGO_STEEL",      unit: "kg",     currentStock: 500,  minimumStock: 100, unitPrice: 220,   location: "Warehouse A - Rack 1" },
  { name: "Core Clamping Plates",            category: "CORE_FRAME",      unit: "kg",     currentStock: 100,  minimumStock: 20,  unitPrice: 85,    location: "Warehouse A - Rack 2" },
  { name: "Core Bolts & Insulation Sleeves", category: "OTHER",           unit: "set",    currentStock: 50,   minimumStock: 10,  unitPrice: 150,   location: "Warehouse A - Rack 2" },

  // ── WINDINGS ──────────────────────────────────────────────────────────────
  { name: "Copper Winding Wire (10 SWG)",    category: "COPPER_COIL",     unit: "kg",     currentStock: 200,  minimumStock: 50,  unitPrice: 850,   location: "Warehouse A - Rack 1" },
  { name: "Copper Winding Wire (14 SWG)",    category: "COPPER_COIL",     unit: "kg",     currentStock: 150,  minimumStock: 50,  unitPrice: 870,   location: "Warehouse A - Rack 1" },
  { name: "Copper Winding Wire (18 SWG)",    category: "COPPER_COIL",     unit: "kg",     currentStock: 100,  minimumStock: 30,  unitPrice: 890,   location: "Warehouse A - Rack 1" },
  { name: "Copper Strip (LV Winding)",       category: "COPPER_COIL",     unit: "kg",     currentStock: 100,  minimumStock: 30,  unitPrice: 840,   location: "Warehouse A - Rack 1" },
  { name: "Aluminum Winding Wire",           category: "COPPER_COIL",     unit: "kg",     currentStock: 80,   minimumStock: 20,  unitPrice: 220,   location: "Warehouse A - Rack 3" },

  // ── INSULATION ────────────────────────────────────────────────────────────
  { name: "Kraft Insulation Paper",          category: "INSULATION",      unit: "kg",     currentStock: 80,   minimumStock: 20,  unitPrice: 180,   location: "Warehouse B - Rack 1" },
  { name: "Pressboard Sheet",                category: "INSULATION",      unit: "kg",     currentStock: 60,   minimumStock: 15,  unitPrice: 250,   location: "Warehouse B - Rack 1" },
  { name: "Crepe Paper Tape",                category: "INSULATION",      unit: "roll",   currentStock: 100,  minimumStock: 20,  unitPrice: 120,   location: "Warehouse B - Rack 2" },
  { name: "Insulation Cylinder (HV-LV)",     category: "INSULATION",      unit: "pcs",    currentStock: 30,   minimumStock: 5,   unitPrice: 800,   location: "Warehouse B - Rack 2" },
  { name: "Nomex Paper",                     category: "INSULATION",      unit: "kg",     currentStock: 20,   minimumStock: 5,   unitPrice: 1800,  location: "Warehouse B - Rack 3" },

  // ── TANK & STRUCTURE ──────────────────────────────────────────────────────
  { name: "MS Steel Plate (Tank Body)",      category: "CORE_FRAME",      unit: "kg",     currentStock: 500,  minimumStock: 100, unitPrice: 75,    location: "Warehouse C - Rack 1" },
  { name: "Conservator Tank",                category: "CORE_FRAME",      unit: "pcs",    currentStock: 20,   minimumStock: 5,   unitPrice: 4500,  location: "Warehouse C - Rack 2" },
  { name: "Lifting Lugs & Brackets",         category: "CORE_FRAME",      unit: "set",    currentStock: 30,   minimumStock: 10,  unitPrice: 600,   location: "Warehouse C - Rack 2" },

  // ── COOLING ───────────────────────────────────────────────────────────────
  { name: "Cooling Radiator Fins",           category: "COOLING_RADIATOR", unit: "set",   currentStock: 25,   minimumStock: 5,   unitPrice: 8000,  location: "Warehouse C - Rack 3" },
  { name: "Cooling Fan (ONAF)",              category: "COOLING_RADIATOR", unit: "pcs",   currentStock: 20,   minimumStock: 4,   unitPrice: 3500,  location: "Warehouse C - Rack 3" },
  { name: "Oil Pump (OFAF)",                 category: "COOLING_RADIATOR", unit: "pcs",   currentStock: 5,    minimumStock: 2,   unitPrice: 12000, location: "Warehouse C - Rack 3" },

  // ── OIL ───────────────────────────────────────────────────────────────────
  { name: "Transformer Mineral Oil",         category: "TRANSFORMER_OIL", unit: "liters", currentStock: 2000, minimumStock: 500, unitPrice: 95,    location: "Oil Storage - Tank 1" },
  { name: "Synthetic Ester Oil",             category: "TRANSFORMER_OIL", unit: "liters", currentStock: 500,  minimumStock: 100, unitPrice: 280,   location: "Oil Storage - Tank 2" },

  // ── BUSHINGS ──────────────────────────────────────────────────────────────
  { name: "HV Bushing (Porcelain)",          category: "BUSHINGS",        unit: "pcs",    currentStock: 60,   minimumStock: 15,  unitPrice: 2200,  location: "Warehouse B - Rack 4" },
  { name: "LV Bushing",                      category: "BUSHINGS",        unit: "pcs",    currentStock: 60,   minimumStock: 15,  unitPrice: 1200,  location: "Warehouse B - Rack 4" },
  { name: "Neutral Bushing",                 category: "BUSHINGS",        unit: "pcs",    currentStock: 30,   minimumStock: 10,  unitPrice: 900,   location: "Warehouse B - Rack 4" },

  // ── TAP CHANGER ───────────────────────────────────────────────────────────
  { name: "Off-Circuit Tap Changer (OCTC)",  category: "TAPPING_SWITCH",  unit: "pcs",    currentStock: 20,   minimumStock: 5,   unitPrice: 7500,  location: "Warehouse B - Rack 5" },
  { name: "On-Load Tap Changer (OLTC)",      category: "TAPPING_SWITCH",  unit: "pcs",    currentStock: 5,    minimumStock: 2,   unitPrice: 85000, location: "Warehouse B - Rack 5" },

  // ── FITTINGS & ACCESSORIES ────────────────────────────────────────────────
  { name: "Buchholz Relay",                  category: "OTHER",           unit: "pcs",    currentStock: 20,   minimumStock: 5,   unitPrice: 4500,  location: "Warehouse D - Rack 1" },
  { name: "Magnetic Oil Gauge (MOG)",        category: "OTHER",           unit: "pcs",    currentStock: 20,   minimumStock: 5,   unitPrice: 1800,  location: "Warehouse D - Rack 1" },
  { name: "Winding Temperature Indicator",   category: "OTHER",           unit: "pcs",    currentStock: 15,   minimumStock: 3,   unitPrice: 6500,  location: "Warehouse D - Rack 1" },
  { name: "Oil Temperature Indicator",       category: "OTHER",           unit: "pcs",    currentStock: 15,   minimumStock: 3,   unitPrice: 4200,  location: "Warehouse D - Rack 1" },
  { name: "Pressure Relief Valve",           category: "OTHER",           unit: "pcs",    currentStock: 20,   minimumStock: 5,   unitPrice: 2800,  location: "Warehouse D - Rack 2" },
  { name: "Silica Gel Breather",             category: "OTHER",           unit: "pcs",    currentStock: 25,   minimumStock: 5,   unitPrice: 1200,  location: "Warehouse D - Rack 2" },
  { name: "Drain & Sampling Valves",         category: "OTHER",           unit: "set",    currentStock: 30,   minimumStock: 8,   unitPrice: 900,   location: "Warehouse D - Rack 2" },
  { name: "Gaskets Set (Cork/Rubber)",       category: "OTHER",           unit: "set",    currentStock: 50,   minimumStock: 10,  unitPrice: 450,   location: "Warehouse D - Rack 3" },
  { name: "Bolts, Nuts & Washers",           category: "OTHER",           unit: "kg",     currentStock: 100,  minimumStock: 20,  unitPrice: 120,   location: "Warehouse D - Rack 3" },
  { name: "Marshalling Box",                 category: "OTHER",           unit: "pcs",    currentStock: 10,   minimumStock: 3,   unitPrice: 8500,  location: "Warehouse D - Rack 4" },
  { name: "Paint & Surface Coating",         category: "PACKAGING",       unit: "liters", currentStock: 50,   minimumStock: 10,  unitPrice: 380,   location: "Warehouse D - Rack 5" },
  { name: "Wooden Packing Crate",            category: "PACKAGING",       unit: "pcs",    currentStock: 15,   minimumStock: 3,   unitPrice: 5500,  location: "Warehouse D - Rack 5" },
]

const BOMS = [
  {
    name: "25 KVA Single Phase Transformer",
    description: "Standard 25 KVA single phase distribution transformer",
    items: [
      { mat: "CRGO Silicon Steel Laminations",  qty: 40  },
      { mat: "Core Clamping Plates",            qty: 8   },
      { mat: "Core Bolts & Insulation Sleeves", qty: 1   },
      { mat: "Copper Winding Wire (10 SWG)",    qty: 8   },
      { mat: "Copper Winding Wire (18 SWG)",    qty: 6   },
      { mat: "Kraft Insulation Paper",          qty: 4   },
      { mat: "Pressboard Sheet",                qty: 2   },
      { mat: "Crepe Paper Tape",                qty: 5   },
      { mat: "Insulation Cylinder (HV-LV)",     qty: 2   },
      { mat: "MS Steel Plate (Tank Body)",      qty: 35  },
      { mat: "Conservator Tank",                qty: 1   },
      { mat: "Lifting Lugs & Brackets",         qty: 1   },
      { mat: "Cooling Radiator Fins",           qty: 1   },
      { mat: "Transformer Mineral Oil",         qty: 60  },
      { mat: "HV Bushing (Porcelain)",          qty: 2   },
      { mat: "LV Bushing",                      qty: 2   },
      { mat: "Neutral Bushing",                 qty: 1   },
      { mat: "Off-Circuit Tap Changer (OCTC)",  qty: 1   },
      { mat: "Buchholz Relay",                  qty: 1   },
      { mat: "Magnetic Oil Gauge (MOG)",        qty: 1   },
      { mat: "Oil Temperature Indicator",       qty: 1   },
      { mat: "Pressure Relief Valve",           qty: 1   },
      { mat: "Silica Gel Breather",             qty: 1   },
      { mat: "Drain & Sampling Valves",         qty: 1   },
      { mat: "Gaskets Set (Cork/Rubber)",       qty: 1   },
      { mat: "Bolts, Nuts & Washers",           qty: 2   },
      { mat: "Paint & Surface Coating",         qty: 3   },
      { mat: "Wooden Packing Crate",            qty: 1   },
    ],
  },
  {
    name: "63 KVA Three Phase Transformer",
    description: "Standard 63 KVA three phase distribution transformer",
    items: [
      { mat: "CRGO Silicon Steel Laminations",  qty: 90  },
      { mat: "Core Clamping Plates",            qty: 18  },
      { mat: "Core Bolts & Insulation Sleeves", qty: 1   },
      { mat: "Copper Winding Wire (10 SWG)",    qty: 15  },
      { mat: "Copper Winding Wire (14 SWG)",    qty: 12  },
      { mat: "Copper Strip (LV Winding)",       qty: 10  },
      { mat: "Kraft Insulation Paper",          qty: 8   },
      { mat: "Pressboard Sheet",                qty: 4   },
      { mat: "Crepe Paper Tape",                qty: 10  },
      { mat: "Insulation Cylinder (HV-LV)",     qty: 6   },
      { mat: "MS Steel Plate (Tank Body)",      qty: 70  },
      { mat: "Conservator Tank",                qty: 1   },
      { mat: "Lifting Lugs & Brackets",         qty: 1   },
      { mat: "Cooling Radiator Fins",           qty: 1   },
      { mat: "Transformer Mineral Oil",         qty: 100 },
      { mat: "HV Bushing (Porcelain)",          qty: 3   },
      { mat: "LV Bushing",                      qty: 3   },
      { mat: "Neutral Bushing",                 qty: 1   },
      { mat: "Off-Circuit Tap Changer (OCTC)",  qty: 1   },
      { mat: "Buchholz Relay",                  qty: 1   },
      { mat: "Magnetic Oil Gauge (MOG)",        qty: 1   },
      { mat: "Oil Temperature Indicator",       qty: 1   },
      { mat: "Pressure Relief Valve",           qty: 1   },
      { mat: "Silica Gel Breather",             qty: 1   },
      { mat: "Drain & Sampling Valves",         qty: 1   },
      { mat: "Gaskets Set (Cork/Rubber)",       qty: 1   },
      { mat: "Bolts, Nuts & Washers",           qty: 4   },
      { mat: "Paint & Surface Coating",         qty: 5   },
      { mat: "Wooden Packing Crate",            qty: 1   },
    ],
  },
  {
    name: "100 KVA Three Phase Transformer",
    description: "Standard 100 KVA three phase distribution transformer",
    items: [
      { mat: "CRGO Silicon Steel Laminations",  qty: 130 },
      { mat: "Core Clamping Plates",            qty: 25  },
      { mat: "Core Bolts & Insulation Sleeves", qty: 1   },
      { mat: "Copper Winding Wire (10 SWG)",    qty: 22  },
      { mat: "Copper Winding Wire (14 SWG)",    qty: 18  },
      { mat: "Copper Strip (LV Winding)",       qty: 15  },
      { mat: "Kraft Insulation Paper",          qty: 12  },
      { mat: "Pressboard Sheet",                qty: 6   },
      { mat: "Crepe Paper Tape",                qty: 15  },
      { mat: "Insulation Cylinder (HV-LV)",     qty: 6   },
      { mat: "MS Steel Plate (Tank Body)",      qty: 100 },
      { mat: "Conservator Tank",                qty: 1   },
      { mat: "Lifting Lugs & Brackets",         qty: 1   },
      { mat: "Cooling Radiator Fins",           qty: 1   },
      { mat: "Transformer Mineral Oil",         qty: 150 },
      { mat: "HV Bushing (Porcelain)",          qty: 3   },
      { mat: "LV Bushing",                      qty: 3   },
      { mat: "Neutral Bushing",                 qty: 1   },
      { mat: "Off-Circuit Tap Changer (OCTC)",  qty: 1   },
      { mat: "Buchholz Relay",                  qty: 1   },
      { mat: "Magnetic Oil Gauge (MOG)",        qty: 1   },
      { mat: "Winding Temperature Indicator",   qty: 1   },
      { mat: "Oil Temperature Indicator",       qty: 1   },
      { mat: "Pressure Relief Valve",           qty: 1   },
      { mat: "Silica Gel Breather",             qty: 1   },
      { mat: "Drain & Sampling Valves",         qty: 1   },
      { mat: "Gaskets Set (Cork/Rubber)",       qty: 1   },
      { mat: "Bolts, Nuts & Washers",           qty: 5   },
      { mat: "Marshalling Box",                 qty: 1   },
      { mat: "Paint & Surface Coating",         qty: 8   },
      { mat: "Wooden Packing Crate",            qty: 1   },
    ],
  },
  {
    name: "250 KVA Three Phase Transformer",
    description: "Heavy duty 250 KVA three phase distribution transformer",
    items: [
      { mat: "CRGO Silicon Steel Laminations",  qty: 280 },
      { mat: "Core Clamping Plates",            qty: 50  },
      { mat: "Core Bolts & Insulation Sleeves", qty: 1   },
      { mat: "Copper Winding Wire (10 SWG)",    qty: 45  },
      { mat: "Copper Winding Wire (14 SWG)",    qty: 35  },
      { mat: "Copper Strip (LV Winding)",       qty: 30  },
      { mat: "Kraft Insulation Paper",          qty: 25  },
      { mat: "Pressboard Sheet",                qty: 12  },
      { mat: "Crepe Paper Tape",                qty: 30  },
      { mat: "Insulation Cylinder (HV-LV)",     qty: 9   },
      { mat: "MS Steel Plate (Tank Body)",      qty: 220 },
      { mat: "Conservator Tank",                qty: 1   },
      { mat: "Lifting Lugs & Brackets",         qty: 1   },
      { mat: "Cooling Radiator Fins",           qty: 1   },
      { mat: "Cooling Fan (ONAF)",              qty: 2   },
      { mat: "Transformer Mineral Oil",         qty: 350 },
      { mat: "HV Bushing (Porcelain)",          qty: 3   },
      { mat: "LV Bushing",                      qty: 3   },
      { mat: "Neutral Bushing",                 qty: 1   },
      { mat: "Off-Circuit Tap Changer (OCTC)",  qty: 1   },
      { mat: "Buchholz Relay",                  qty: 1   },
      { mat: "Magnetic Oil Gauge (MOG)",        qty: 1   },
      { mat: "Winding Temperature Indicator",   qty: 1   },
      { mat: "Oil Temperature Indicator",       qty: 1   },
      { mat: "Pressure Relief Valve",           qty: 1   },
      { mat: "Silica Gel Breather",             qty: 1   },
      { mat: "Drain & Sampling Valves",         qty: 1   },
      { mat: "Gaskets Set (Cork/Rubber)",       qty: 1   },
      { mat: "Bolts, Nuts & Washers",           qty: 10  },
      { mat: "Marshalling Box",                 qty: 1   },
      { mat: "Paint & Surface Coating",         qty: 15  },
      { mat: "Wooden Packing Crate",            qty: 1   },
    ],
  },
  {
    name: "500 KVA Three Phase Transformer",
    description: "Large 500 KVA three phase power transformer",
    items: [
      { mat: "CRGO Silicon Steel Laminations",  qty: 520 },
      { mat: "Core Clamping Plates",            qty: 90  },
      { mat: "Core Bolts & Insulation Sleeves", qty: 2   },
      { mat: "Copper Winding Wire (10 SWG)",    qty: 80  },
      { mat: "Copper Winding Wire (14 SWG)",    qty: 60  },
      { mat: "Copper Strip (LV Winding)",       qty: 55  },
      { mat: "Kraft Insulation Paper",          qty: 45  },
      { mat: "Pressboard Sheet",                qty: 22  },
      { mat: "Crepe Paper Tape",                qty: 55  },
      { mat: "Insulation Cylinder (HV-LV)",     qty: 12  },
      { mat: "MS Steel Plate (Tank Body)",      qty: 420 },
      { mat: "Conservator Tank",                qty: 1   },
      { mat: "Lifting Lugs & Brackets",         qty: 1   },
      { mat: "Cooling Radiator Fins",           qty: 2   },
      { mat: "Cooling Fan (ONAF)",              qty: 4   },
      { mat: "Transformer Mineral Oil",         qty: 700 },
      { mat: "HV Bushing (Porcelain)",          qty: 3   },
      { mat: "LV Bushing",                      qty: 3   },
      { mat: "Neutral Bushing",                 qty: 1   },
      { mat: "On-Load Tap Changer (OLTC)",      qty: 1   },
      { mat: "Buchholz Relay",                  qty: 1   },
      { mat: "Magnetic Oil Gauge (MOG)",        qty: 1   },
      { mat: "Winding Temperature Indicator",   qty: 1   },
      { mat: "Oil Temperature Indicator",       qty: 1   },
      { mat: "Pressure Relief Valve",           qty: 1   },
      { mat: "Silica Gel Breather",             qty: 1   },
      { mat: "Drain & Sampling Valves",         qty: 2   },
      { mat: "Gaskets Set (Cork/Rubber)",       qty: 2   },
      { mat: "Bolts, Nuts & Washers",           qty: 18  },
      { mat: "Marshalling Box",                 qty: 1   },
      { mat: "Paint & Surface Coating",         qty: 25  },
      { mat: "Wooden Packing Crate",            qty: 1   },
    ],
  },
]

async function main() {
  console.log("⏳  Seeding Gagan Transmissions inventory & BOMs...")

  // 1. Insert only materials that don't already exist (match by name)
  const existing = await prisma.rawMaterial.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((m) => m.name))

  const toCreate = MATERIALS.filter((m) => !existingNames.has(m.name))
  if (toCreate.length > 0) {
    await prisma.rawMaterial.createMany({ data: toCreate as any })
    console.log(`✅  Added ${toCreate.length} new materials (${existingNames.size} already existed)`)
  } else {
    console.log("ℹ️   All materials already exist — skipping")
  }

  // 2. Build name → id map for all materials
  const allMaterials = await prisma.rawMaterial.findMany({ select: { id: true, name: true } })
  const nameToId = new Map(allMaterials.map((m) => [m.name, m.id]))

  // 3. Create BOMs that don't already exist
  const existingBoms = await prisma.billOfMaterials.findMany({ select: { name: true } })
  const existingBomNames = new Set(existingBoms.map((b) => b.name))

  let created = 0
  for (const bom of BOMS) {
    if (existingBomNames.has(bom.name)) {
      console.log(`ℹ️   BOM "${bom.name}" already exists — skipping`)
      continue
    }

    const items = bom.items
      .map((i) => ({ materialId: nameToId.get(i.mat), quantity: i.qty }))
      .filter((i): i is { materialId: string; quantity: number } => !!i.materialId)

    const missing = bom.items.filter((i) => !nameToId.get(i.mat))
    if (missing.length) {
      console.warn(`⚠️   "${bom.name}" — missing: ${missing.map((m) => m.mat).join(", ")}`)
    }

    await prisma.billOfMaterials.create({
      data: { name: bom.name, description: bom.description, items: { create: items } },
    })
    console.log(`✅  Created BOM: ${bom.name} (${items.length} items)`)
    created++
  }

  console.log(`\n🎉  Done — ${toCreate.length} materials + ${created} BOMs added`)
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
