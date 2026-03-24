import { NextRequest, NextResponse } from 'next/server';
import { dashboardFilterSchema } from '@/lib/validation';
import { getDashboardReport } from '@/lib/report';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const report = await getDashboardReport(
    dashboardFilterSchema.parse({
      start: url.searchParams.get('start') ?? undefined,
      end: url.searchParams.get('end') ?? undefined,
      brand: url.searchParams.get('brand') ?? undefined,
      allocatedBase: url.searchParams.get('allocatedBase') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
    }),
  );

  return NextResponse.json({ report });
}