import Link from 'next/link';
import { EquipmentStatus } from '@prisma/client';
import { Badge, Button, Card, CardDescription, CardTitle, Input, Label, Notice, StatCard, Table, TableCell, TableHeadCell } from '@/components/ui';
import { formatPeriod, getDashboardReport } from '@/lib/report';
import { dashboardFilterSchema } from '@/lib/validation';

function valueOf(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function toInputDate(value: Date | undefined) {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function statusTone(status: EquipmentStatus | 'UNKNOWN') {
  if (status === EquipmentStatus.OPERATIONAL) return 'success' as const;
  if (status === EquipmentStatus.BROKEN) return 'danger' as const;
  return 'warning' as const;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const message = valueOf(resolvedSearchParams, 'message');
  const error = valueOf(resolvedSearchParams, 'error');
  const filterInput = dashboardFilterSchema.parse({
    start: valueOf(resolvedSearchParams, 'start'),
    end: valueOf(resolvedSearchParams, 'end'),
    brand: valueOf(resolvedSearchParams, 'brand'),
    allocatedBase: valueOf(resolvedSearchParams, 'allocatedBase'),
    search: valueOf(resolvedSearchParams, 'search'),
  });

  const report = await getDashboardReport(filterInput);

  return (
    <div className="space-y-8">
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <section className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_35%)]" />
          <div className="relative space-y-4">
            <Badge tone="success">Período ativo</Badge>
            <CardTitle>Resumo operacional</CardTitle>
            <CardDescription>
              {formatPeriod(report.period)}
            </CardDescription>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total de equipamentos" value={String(report.totalEquipment)} hint="Filtrado pelos critérios do painel" />
              <StatCard label="Média de disponibilidade" value={`${report.averageAvailability.toFixed(2)}%`} hint="Percentual médio no período" />
              <StatCard label="Horas indisponíveis" value={`${report.totalUnavailableHours.toFixed(2)}h`} hint="Soma das janelas BROKEN" />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Exportação e atalhos</CardTitle>
          <CardDescription>Use os filtros abaixo para refinar o relatório e exportar o CSV já consolidado.</CardDescription>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              href={`/api/dashboard/export?${new URLSearchParams(
                Object.entries({
                  start: report.filters.start ? toInputDate(report.filters.start as Date) : '',
                  end: report.filters.end ? toInputDate(report.filters.end as Date) : '',
                  brand: report.filters.brand,
                  allocatedBase: report.filters.allocatedBase,
                  search: report.filters.search ?? '',
                }).filter(([, value]) => value.length > 0),
              ).toString()}`}
            >
              Baixar CSV
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href="/equipments">
              Gerenciar equipamentos
            </Link>
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Filtros do relatório</CardTitle>
        <CardDescription>Período padrão: últimos 30 dias. O cálculo assume indisponibilidade quando não há histórico anterior.</CardDescription>
        <form className="mt-6 grid gap-4 lg:grid-cols-5" method="get">
          <div>
            <Label htmlFor="start">Início</Label>
            <Input id="start" name="start" type="datetime-local" defaultValue={toInputDate(report.period.start)} />
          </div>
          <div>
            <Label htmlFor="end">Fim</Label>
            <Input id="end" name="end" type="datetime-local" defaultValue={toInputDate(report.period.end)} />
          </div>
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" name="brand" defaultValue={report.filters.brand} placeholder="Bosch" />
          </div>
          <div>
            <Label htmlFor="allocatedBase">Base</Label>
            <Input id="allocatedBase" name="allocatedBase" defaultValue={report.filters.allocatedBase} placeholder="Base Norte" />
          </div>
          <div>
            <Label htmlFor="search">Busca</Label>
            <Input id="search" name="search" defaultValue={report.filters.search ?? ''} placeholder="Inventário, nome ou local" />
          </div>
          <div className="lg:col-span-5">
            <Button type="submit">Aplicar filtros</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Equipamentos no período</CardTitle>
        <div className="mt-6 overflow-hidden rounded-2xl">
          <Table>
            <thead>
              <tr>
                <TableHeadCell>Inventário</TableHeadCell>
                <TableHeadCell>Nome</TableHeadCell>
                <TableHeadCell>Marca / Base</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Disponibilidade</TableHeadCell>
                <TableHeadCell>Indisponível</TableHeadCell>
                <TableHeadCell>Ações</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                    Nenhum equipamento encontrado com os filtros aplicados.
                  </TableCell>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-white/5">
                    <TableCell className="font-medium text-white">{row.inventoryNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{row.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{row.currentLocation}</div>
                    </TableCell>
                    <TableCell>
                      <div>{row.brand}</div>
                      <div className="mt-1 text-xs text-slate-400">{row.allocatedBase}</div>
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone(row.latestStatus)}>{row.latestStatus}</Badge>
                    </TableCell>
                    <TableCell>{row.availability.availabilityPercent.toFixed(2)}%</TableCell>
                    <TableCell>{row.availability.unavailableHours.toFixed(2)}h</TableCell>
                    <TableCell>
                      <Link className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href={`/equipments/${row.id}`}>
                        Abrir
                      </Link>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}