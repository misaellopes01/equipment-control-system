import { PrismaClient, EquipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.equipmentStatusEvent.deleteMany();
  await prisma.equipment.deleteMany();

  const equipmentSeed = [
    {
      inventoryNumber: 'INV-1001',
      brand: 'Bosch',
      name: 'Rotary Hammer',
      allocatedBase: 'Base Norte',
      currentLocation: 'Workshop A',
      isContractual: true,
      contractCode: 'CTR-2026-01',
      contractStartAt: new Date('2026-01-05T00:00:00.000Z'),
      contractEndAt: new Date('2027-01-05T00:00:00.000Z'),
    },
    {
      inventoryNumber: 'INV-1002',
      brand: 'Makita',
      name: 'Circular Saw',
      allocatedBase: 'Base Sul',
      currentLocation: 'Yard 2',
      isContractual: false,
    },
    {
      inventoryNumber: 'INV-1003',
      brand: 'DeWalt',
      name: 'Impact Drill',
      allocatedBase: 'Base Norte',
      currentLocation: 'Workshop B',
      isContractual: true,
      contractCode: 'CTR-2025-14',
      contractStartAt: new Date('2025-11-01T00:00:00.000Z'),
      contractEndAt: new Date('2026-11-01T00:00:00.000Z'),
    },
  ];

  const created = [];
  for (const data of equipmentSeed) {
    created.push(await prisma.equipment.create({ data }));
  }

  const [hammer, saw, drill] = created;

  await prisma.equipmentStatusEvent.createMany({
    data: [
      {
        equipmentId: hammer.id,
        status: EquipmentStatus.OPERATIONAL,
        startedAt: new Date('2026-03-01T08:00:00.000Z'),
        endedAt: new Date('2026-03-10T10:00:00.000Z'),
        notes: 'Equipment available after preventive maintenance.',
      },
      {
        equipmentId: hammer.id,
        status: EquipmentStatus.BROKEN,
        startedAt: new Date('2026-03-10T10:00:00.000Z'),
        endedAt: new Date('2026-03-14T16:00:00.000Z'),
        notes: 'Hydraulic issue resolved by replacement of seal kit.',
      },
      {
        equipmentId: hammer.id,
        status: EquipmentStatus.OPERATIONAL,
        startedAt: new Date('2026-03-14T16:00:00.000Z'),
        notes: 'Returned to service.',
      },
      {
        equipmentId: saw.id,
        status: EquipmentStatus.BROKEN,
        startedAt: new Date('2026-03-05T09:00:00.000Z'),
        endedAt: new Date('2026-03-12T12:00:00.000Z'),
        notes: 'Blade alignment failure.',
      },
      {
        equipmentId: saw.id,
        status: EquipmentStatus.OPERATIONAL,
        startedAt: new Date('2026-03-12T12:00:00.000Z'),
        notes: 'Aligned and cleared for use.',
      },
      {
        equipmentId: drill.id,
        status: EquipmentStatus.OPERATIONAL,
        startedAt: new Date('2026-02-20T07:00:00.000Z'),
        endedAt: new Date('2026-03-08T19:00:00.000Z'),
        notes: 'Initial deployment period.',
      },
      {
        equipmentId: drill.id,
        status: EquipmentStatus.BROKEN,
        startedAt: new Date('2026-03-08T19:00:00.000Z'),
        notes: 'Motor overheating under load.',
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });