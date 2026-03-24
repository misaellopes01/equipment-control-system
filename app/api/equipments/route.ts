import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, isAppError } from '@/lib/errors';
import { createEquipment, listEquipments } from '@/lib/report';
import { equipmentSchema } from '@/lib/validation';

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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const equipments = await listEquipments({
    search: url.searchParams.get('q') ?? undefined,
    brand: url.searchParams.get('brand') ?? undefined,
    allocatedBase: url.searchParams.get('allocatedBase') ?? undefined,
  });
  return NextResponse.json({ equipments });
}

export async function POST(request: NextRequest) {
  try {
    const payload = equipmentSchema.parse(await parsePayload(request));
    const equipment = await createEquipment(payload);

    if (asJsonRequest(request)) {
      return NextResponse.json({ equipment }, { status: 201 });
    }

    return NextResponse.redirect(new URL('/equipments?message=equipment-created', request.url));
  } catch (error) {
    if (isAppError(error)) {
      if (asJsonRequest(request)) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      return NextResponse.redirect(new URL(`/equipments?error=${encodeURIComponent(error.message)}`, request.url));
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido.', details: error.message }, { status: 400 });
    }

    throw error;
  }
}