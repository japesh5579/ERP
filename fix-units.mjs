import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all items that should be measured in kg
  const items = await prisma.rawMaterial.findMany({
    where: {
      OR: [
        // Copper/Aluminum category
        { category: 'COPPER_COIL' },
        // Name patterns for strips and wires
        { name: { contains: 'DPC',    mode: 'insensitive' } },
        { name: { contains: 'STRIP',  mode: 'insensitive' } },
        { name: { contains: 'FLAT',   mode: 'insensitive' } },
        { name: { contains: 'FOIL',   mode: 'insensitive' } },
        { name: { contains: 'WIRE',   mode: 'insensitive' } },
        { name: { contains: 'COIL',   mode: 'insensitive' } },
        { name: { contains: 'ALUM',   mode: 'insensitive' } },
        { name: { contains: 'COPPER', mode: 'insensitive' } },
      ]
    }
  });

  console.log(`Found ${items.length} items to check:\n`);

  let updated = 0;
  for (const item of items) {
    if (item.unit !== 'kg') {
      await prisma.rawMaterial.update({
        where: { id: item.id },
        data: { unit: 'kg' }
      });
      console.log(`  ✅ ${item.name}  (${item.unit} → kg)  stock: ${item.currentStock}`);
      updated++;
    } else {
      console.log(`  ✓  ${item.name}  already kg`);
    }
  }

  console.log(`\n✅ Updated ${updated} items to kg`);
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
