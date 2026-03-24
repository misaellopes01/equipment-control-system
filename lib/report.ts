import { EquipmentStatus, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { calculateAvailability, type AvailabilityResult } from '@/lib/availability';
import { AppError } from '@/lib/errors';
import { planStatusEventInsertion } from '@/lib/status-transitions';
import type { DashboardFilterInput, EquipmentInput, EquipmentUpdateInput, StatusEventInput } from '@/lib/validation';

export type EquipmentWithState = Prisma.EquipmentGetPayload<{
  include: { statusEvents: { orderBy: { startedAt: 'asc' } } };
}>;

export type DashboardEquipmentRow = {
  id: string;
  inventoryNumber: string;
  brand: string;
  name: string;
  allocatedBase: string;
  currentLocation: string;
  latestStatus: EquipmentStatus | 'UNKNOWN';
  availability: AvailabilityResult;
};

export type DashboardReport = {
  filters: Required<Pick<DashboardFilterInput, 'brand' | 'allocatedBase'>> & Pick<DashboardFilterInput, 'start' | 'end' | 'search'>;
  period: { start: Date; end: Date };
  totalEquipment: number;
  averageAvailability: number;
  totalUnavailableHours: number;
  rows: DashboardEquipmentRow[];
};

function ensureDateWindow(input: DashboardFilterInput) {
  const end = input.end ?? new Date();
  const start = input.start ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (end <= start) {
    throw new AppError('O período final precisa ser posterior ao inicial.', 400, 'INVALID_PERIOD');
  }
  return { start, end };
}

function currentStateFromEvents(events: { status: EquipmentStatus; startedAt: Date; endedAt: Date | null }[]) {
  if (events.length === 0) {
    return 'UNKNOWN' as const;
  }

  const latest = [...events].sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())[0];
  return latest.status;
}

function filterPrisma(input: DashboardFilterInput) {
  const where: Prisma.EquipmentWhereInput = {};

  if (input.brand) {
    where.brand = { contains: input.brand, mode: 'insensitive' };
  }

  if (input.allocatedBase) {
    where.allocatedBase = { contains: input.allocatedBase, mode: 'insensitive' };
  }

  if (input.search) {
    where.OR = [
      { inventoryNumber: { contains: input.search, mode: 'insensitive' } },
      { name: { contains: input.search, mode: 'insensitive' } },
      { currentLocation: { contains: input.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listEquipments(input: DashboardFilterInput = {}) {
  const equipments = await prisma.equipment.findMany({
    where: filterPrisma(input),
    include: { statusEvents: { orderBy: { startedAt: 'asc' } } },
    orderBy: [{ brand: 'asc' }, { inventoryNumber: 'asc' }],
  });

  return equipments;
}

export async function getEquipment(id: string) {
  return prisma.equipment.findUnique({
    where: { id },
    include: { statusEvents: { orderBy: { startedAt: 'asc' } } },
  });
}

export async function createEquipment(data: EquipmentInput) {
  const exists = await prisma.equipment.findUnique({ where: { inventoryNumber: data.inventoryNumber } });
  if (exists) {
    throw new AppError('Já existe equipamento com este nº de inventário.', 409, 'DUPLICATE_INVENTORY_NUMBER');
  }

  return prisma.equipment.create({ data });
}

export async function updateEquipment(id: string, data: EquipmentUpdateInput) {
  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) {
    throw new AppError('Equipamento não encontrado.', 404, 'EQUIPMENT_NOT_FOUND');
  }

  if (data.inventoryNumber && data.inventoryNumber !== equipment.inventoryNumber) {
    const duplicate = await prisma.equipment.findUnique({ where: { inventoryNumber: data.inventoryNumber } });
    if (duplicate) {
      throw new AppError('Já existe equipamento com este nº de inventário.', 409, 'DUPLICATE_INVENTORY_NUMBER');
    }
  }

  return prisma.equipment.update({ where: { id }, data });
}

export async function listStatusEvents(equipmentId: string) {
  return prisma.equipmentStatusEvent.findMany({
    where: { equipmentId },
    orderBy: [{ startedAt: 'desc' }],
  });
}

export async function createStatusEvent(input: StatusEventInput) {
  return prisma.$transaction(async (transaction) => {
    const equipment = await transaction.equipment.findUnique({
      where: { id: input.equipmentId },
      include: { statusEvents: { orderBy: { startedAt: 'asc' } } },
    });

    if (!equipment) {
      throw new AppError('Equipamento não encontrado.', 404, 'EQUIPMENT_NOT_FOUND');
    }

    const plan = planStatusEventInsertion(equipment.statusEvents, {
      equipmentId: input.equipmentId,
      status: input.status,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      notes: input.notes,
    });

    if (plan.closeEventId) {
      await transaction.equipmentStatusEvent.update({
        where: { id: plan.closeEventId },
        data: { endedAt: input.startedAt },
      });
    }

    return transaction.equipmentStatusEvent.create({
      data: plan.insert,
    });
  });
}

export async function getDashboardReport(input: DashboardFilterInput): Promise<DashboardReport> {
  const period = ensureDateWindow(input);
  const equipments = await prisma.equipment.findMany({
    where: filterPrisma(input),
    include: {
      statusEvents: {
        where: { startedAt: { lt: period.end } },
        orderBy: { startedAt: 'asc' },
      },
    },
    orderBy: [{ brand: 'asc' }, { inventoryNumber: 'asc' }],
  });

  const rows = equipments.map((equipment) => {
    const availability = calculateAvailability(equipment.statusEvents, period);
    return {
      id: equipment.id,
      inventoryNumber: equipment.inventoryNumber,
      brand: equipment.brand,
      name: equipment.name,
      allocatedBase: equipment.allocatedBase,
      currentLocation: equipment.currentLocation,
      latestStatus: currentStateFromEvents(equipment.statusEvents),
      availability,
    } satisfies DashboardEquipmentRow;
  });

  const averageAvailability = rows.length === 0 ? 0 : rows.reduce((sum, row) => sum + row.availability.availabilityPercent, 0) / rows.length;
  const totalUnavailableHours = rows.reduce((sum, row) => sum + row.availability.unavailableHours, 0);

  return {
    filters: {
      start: input.start,
      end: input.end,
      brand: input.brand ?? '',
      allocatedBase: input.allocatedBase ?? '',
      search: input.search,
    },
    period,
    totalEquipment: rows.length,
    averageAvailability: Math.round(averageAvailability * 100) / 100,
    totalUnavailableHours: Math.round(totalUnavailableHours * 100) / 100,
    rows,
  };
}

export async function buildReportCsv(input: DashboardFilterInput) {
  const report = await getDashboardReport(input);
  const header = [
    'inventoryNumber',
    'brand',
    'name',
    'allocatedBase',
    'currentLocation',
    'latestStatus',
    'availableHours',
    'unavailableHours',
    'availableDays',
    'unavailableDays',
    'availabilityPercent',
  ];

  const lines = [
    header.join(','),
    ...report.rows.map((row) => [
      row.inventoryNumber,
      row.brand,
      row.name,
      row.allocatedBase,
      row.currentLocation,
      row.latestStatus,
      row.availability.availableHours,
      row.availability.unavailableHours,
      row.availability.availableDays,
      row.availability.unavailableDays,
      row.availability.availabilityPercent,
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
  ];

  return lines.join('\n');
}

export function formatPeriod(period: { start: Date; end: Date }) {
  return `${format(period.start, 'dd/MM/yyyy HH:mm')} - ${format(period.end, 'dd/MM/yyyy HH:mm')}`;
}