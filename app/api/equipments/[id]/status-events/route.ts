import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isAppError } from '@/lib/errors';
import { createStatusEvent, getEquipment, listStatusEvents } from '@/lib/report';
import { statusEventSchema } from '@/lib/validation';

async function parsePayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function asJsonRequest(request: NextRequest) {
  return (request.headers.get('accept') ?? '').includes('application/json') || (request.headers.get('content-type') ?? '').includes('application/json');
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await listStatusEvents(id);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = statusEventSchema.parse({ ...(await parsePayload(request)), equipmentId: id });
    const event = await createStatusEvent(payload);

    if (asJsonRequest(request)) {
      return NextResponse.json({ event }, { status: 201 });
    }

    return NextResponse.redirect(new URL(`/equipments/${id}?message=status-event-created`, request.url));
  } catch (error) {
    if (isAppError(error)) {
      if (asJsonRequest(request)) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      const { id } = await params;
      return NextResponse.redirect(new URL(`/equipments/${id}?error=${encodeURIComponent(error.message)}`, request.url));
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido.', details: error.message }, { status: 400 });
    }

    throw error;
  }
}