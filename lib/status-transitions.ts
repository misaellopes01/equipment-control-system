import { EquipmentStatus } from '@prisma/client';
import { AppError } from '@/lib/errors';

export type StatusEventSnapshot = {
  id: string;
  status: EquipmentStatus;
  startedAt: Date;
  endedAt: Date | null;
};

export type PlannedStatusEvent = {
  closeEventId?: string;
  insert: {
    equipmentId: string;
    status: EquipmentStatus;
    startedAt: Date;
    endedAt?: Date | null;
    notes?: string | null;
  };
};

export function planStatusEventInsertion(events: StatusEventSnapshot[], input: PlannedStatusEvent['insert']): PlannedStatusEvent {
  const orderedEvents = [...events].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime());
  const lastEvent = orderedEvents[orderedEvents.length - 1];

  if (lastEvent && lastEvent.startedAt > input.startedAt) {
    throw new AppError('Não é permitido inserir um evento anterior ao último evento registrado.', 409, 'OVERLAPPING_EVENT');
  }

  const overlap = orderedEvents.find((event) => {
    if (event.id === lastEvent?.id) {
      return false;
    }

    const eventEnd = event.endedAt ?? new Date(8640000000000000);
    return event.startedAt < input.startedAt && eventEnd > input.startedAt;
  });

  if (overlap) {
    throw new AppError('O novo evento sobrepõe um período já registrado.', 409, 'OVERLAPPING_EVENT');
  }

  if (lastEvent && lastEvent.endedAt && lastEvent.endedAt > input.startedAt) {
    throw new AppError('O novo evento sobrepõe um período já encerrado.', 409, 'OVERLAPPING_EVENT');
  }

  return {
    closeEventId: lastEvent && !lastEvent.endedAt ? lastEvent.id : undefined,
    insert: input,
  };
}