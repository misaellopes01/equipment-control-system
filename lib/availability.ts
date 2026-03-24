import { EquipmentStatus } from '@prisma/client';

export type StatusEventLike = {
  status: EquipmentStatus;
  startedAt: Date;
  endedAt?: Date | null;
};

export type AvailabilityWindow = {
  start: Date;
  end: Date;
};

export type AvailabilityResult = {
  availableHours: number;
  unavailableHours: number;
  availableDays: number;
  unavailableDays: number;
  availabilityPercent: number;
};

const HOURS_PER_DAY = 24;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function positiveDiffHours(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

export function calculateAvailability(events: StatusEventLike[], window: AvailabilityWindow): AvailabilityResult {
  if (window.end <= window.start) {
    throw new Error('A data final precisa ser posterior à data inicial.');
  }

  const orderedEvents = [...events].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime());
  const windowEvents = orderedEvents.filter((event) => event.startedAt < window.end);
  const baselineEvent = [...orderedEvents].reverse().find((event) => event.startedAt <= window.start);

  let cursor = window.start;
  let currentStatus: EquipmentStatus | null = baselineEvent ? baselineEvent.status : null;
  let availableHours = 0;
  let unavailableHours = 0;

  for (const event of windowEvents) {
    if (event.startedAt < window.start) {
      continue;
    }

    const segmentEnd = event.startedAt > cursor ? event.startedAt : cursor;
    const segmentHours = positiveDiffHours(cursor, segmentEnd);

    if (segmentHours > 0) {
      if (currentStatus === EquipmentStatus.OPERATIONAL) {
        availableHours += segmentHours;
      } else {
        unavailableHours += segmentHours;
      }
    }

    cursor = segmentEnd;
    currentStatus = event.status;
  }

  if (cursor < window.end) {
    const remainingHours = positiveDiffHours(cursor, window.end);
    if (currentStatus === EquipmentStatus.OPERATIONAL) {
      availableHours += remainingHours;
    } else {
      unavailableHours += remainingHours;
    }
  }

  const totalHours = availableHours + unavailableHours;
  return {
    availableHours: round2(availableHours),
    unavailableHours: round2(unavailableHours),
    availableDays: round2(availableHours / HOURS_PER_DAY),
    unavailableDays: round2(unavailableHours / HOURS_PER_DAY),
    availabilityPercent: totalHours === 0 ? 0 : round2((availableHours / totalHours) * 100),
  };
}