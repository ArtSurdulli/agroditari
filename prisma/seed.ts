import { PrismaClient } from "@prisma/client";
import type { UnitType } from "@prisma/client";

const prisma = new PrismaClient();

type DefaultCrop = {
  name: string;
  category: string;
  standardUnit: UnitType;
};

// AgroDitari defaults — crops common in Kosovo/Albania farming. Seeded with
// createdById left null so they read as global defaults, not user-created.
const defaultCrops: DefaultCrop[] = [
  { name: "Grurë", category: "Drithëra", standardUnit: "ton" },
  { name: "Misër", category: "Drithëra", standardUnit: "ton" },
  { name: "Elb", category: "Drithëra", standardUnit: "ton" },
  { name: "Thekër", category: "Drithëra", standardUnit: "ton" },
  { name: "Tërshërë", category: "Drithëra", standardUnit: "ton" },
  { name: "Patate", category: "Perime", standardUnit: "kg" },
  { name: "Domate", category: "Perime", standardUnit: "kg" },
  { name: "Spec", category: "Perime", standardUnit: "kg" },
  { name: "Qepë", category: "Perime", standardUnit: "kg" },
  { name: "Lakër", category: "Perime", standardUnit: "kg" },
  { name: "Kastravec", category: "Perime", standardUnit: "kg" },
  { name: "Karrotë", category: "Perime", standardUnit: "kg" },
  { name: "Fasule", category: "Perime", standardUnit: "kg" },
  { name: "Bizele", category: "Perime", standardUnit: "kg" },
  { name: "Luledielli", category: "Vajore", standardUnit: "ton" },
  { name: "Jonxhë", category: "Forazhere", standardUnit: "ton" },
  { name: "Mollë", category: "Pemtari", standardUnit: "kg" },
  { name: "Rrush", category: "Pemtari", standardUnit: "kg" },
];

async function main() {
  for (const crop of defaultCrops) {
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: {
        category: crop.category,
        standardUnit: crop.standardUnit,
        createdById: null,
      },
      create: {
        name: crop.name,
        category: crop.category,
        standardUnit: crop.standardUnit,
        createdById: null,
      },
    });
  }

  const total = await prisma.crop.count();
  console.log(
    `Seeded ${defaultCrops.length} default crops. Total crops in db: ${total}.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });