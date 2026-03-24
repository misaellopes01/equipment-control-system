import { describe, expect, it } from 'vitest';
import { EquipmentStatus } from '@prisma/client';
import { calculateAvailability } from '@/lib/availability';
import { planStatusEventInsertion } from '@/lib/status-transitions';

describe('calculateAvailability', () => {
  it('treats periods with no history as unavailable', () => {
    const result = calculateAvailability([], {
      start: new Date('2026-03-01T00:00:00.000Z'),
      end: new Date('2026-03-02T00:00:00.000Z'),
    });

    expect(result.availableHours).toBe(0);
    expect(result.unavailableHours).toBe(24);
    expect(result.availabilityPercent).toBe(0);
  });

  it('uses the last known status before the window and splits on later events', () => {
    const result = calculateAvailability(
      [
        {
          status: EquipmentStatus.OPERATIONAL,
          startedAt: new Date('2026-02-28T12:00:00.000Z'),
          endedAt: new Date('2026-03-01T12:00:00.000Z'),
        },
        {
          status: EquipmentStatus.BROKEN,
          startedAt: new Date('2026-03-01T12:00:00.000Z'),
          endedAt: new Date('2026-03-01T18:00:00.000Z'),
        },
      ],
      {
        start: new Date('2026-03-01T00:00:00.000Z'),
        end: new Date('2026-03-02T00:00:00.000Z'),
      },
    );

    expect(result.availableHours).toBe(12);
    expect(result.unavailableHours).toBe(12);
    expect(result.availabilityPercent).toBe(50);
  });
});

describe('planStatusEventInsertion', () => {
  it('auto-closes the open event before inserting a new one', () => {
    const plan = planStatusEventInsertion(
      [
        {
          id: 'event-1',
          status: EquipmentStatus.OPERATIONAL,
          startedAt: new Date('2026-03-01T08:00:00.000Z'),
          endedAt: null,
        },
      ],
      {
        equipmentId: 'equipment-1',
        status: EquipmentStatus.BROKEN,
        startedAt: new Date('2026-03-02T10:00:00.000Z'),
        notes: 'Issue found during inspection.',
      },
    );

    expect(plan.closeEventId).toBe('event-1');
    expect(plan.insert.status).toBe(EquipmentStatus.BROKEN);
  });

  it('rejects overlapping events', () => {
    expect(() =>
      planStatusEventInsertion(
        [
          {
            id: 'event-1',
            status: EquipmentStatus.OPERATIONAL,
            startedAt: new Date('2026-03-01T08:00:00.000Z'),
            endedAt: new Date('2026-03-03T08:00:00.000Z'),
          },
        ],
        {
          equipmentId: 'equipment-1',
          status: EquipmentStatus.BROKEN,
          startedAt: new Date('2026-03-02T10:00:00.000Z'),
        },
      ),
    ).toThrow(/O novo evento sobrepõe um período já/);
  });
});