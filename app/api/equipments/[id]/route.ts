import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isAppError } from '@/lib/errors';
import { getEquipment, updateEquipment } from '@/lib/report';
import { equipmentUpdateSchema } from '@/lib/validation';

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
  const equipment = await getEquipment(id);
  if (!equipment) {
    return NextResponse.json({ error: 'Equipamento não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ equipment });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEquipmentHandler(request, id);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEquipmentHandler(request, id);
}

async function updateEquipmentHandler(request: NextRequest, equipmentId: string) {
  try {
    const payload = equipmentUpdateSchema.parse(await parsePayload(request));
    const equipment = await updateEquipment(equipmentId, payload);

    if (asJsonRequest(request)) {
      return NextResponse.json({ equipment });
    }

    return NextResponse.redirect(new URL(`/equipments/${equipmentId}?message=equipment-updated`, request.url));
  } catch (error) {
    if (isAppError(error)) {
      if (asJsonRequest(request)) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      return NextResponse.redirect(new URL(`/equipments/${equipmentId}?error=${encodeURIComponent(error.message)}`, request.url));
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido.', details: error.message }, { status: 400 });
    }

    throw error;
  }
}