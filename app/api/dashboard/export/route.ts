import { NextRequest, NextResponse } from 'next/server';
import { dashboardFilterSchema } from '@/lib/validation';
import { buildReportCsv } from '@/lib/report';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const csv = await buildReportCsv(
    dashboardFilterSchema.parse({
      start: url.searchParams.get('start') ?? undefined,
      end: url.searchParams.get('end') ?? undefined,
      brand: url.searchParams.get('brand') ?? undefined,
      allocatedBase: url.searchParams.get('allocatedBase') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
    }),
  );

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="equipment-report.csv"',
    },
  });
}