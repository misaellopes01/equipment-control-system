import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EquipmentStatus } from '@prisma/client';
import { Badge, Button, Card, CardDescription, CardTitle, Input, Label, Notice, Table, TableCell, TableHeadCell, Textarea } from '@/components/ui';
import { calculateAvailability } from '@/lib/availability';
import { getEquipment } from '@/lib/report';
import { format } from 'date-fns';

function valueOf(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function toInputDateTime(value: Date | undefined) {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toInputDate(value: Date | undefined) {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function statusTone(status: EquipmentStatus | 'UNKNOWN') {
  if (status === EquipmentStatus.OPERATIONAL) return 'success' as const;
  if (status === EquipmentStatus.BROKEN) return 'danger' as const;
  return 'warning' as const;
}

export default async function EquipmentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const message = valueOf(resolvedSearchParams, 'message');
  const error = valueOf(resolvedSearchParams, 'error');
  const equipment = await getEquipment(id);
  if (!equipment) {
    notFound();
  }

  const periodEnd = valueOf(resolvedSearchParams, 'end') ? new Date(valueOf(resolvedSearchParams, 'end')!) : new Date();
  const periodStart = valueOf(resolvedSearchParams, 'start') ? new Date(valueOf(resolvedSearchParams, 'start')!) : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const availability = calculateAvailability(equipment.statusEvents, { start: periodStart, end: periodEnd });
  const latestStatus = equipment.statusEvents.length > 0 ? equipment.statusEvents[equipment.statusEvents.length - 1].status : 'UNKNOWN';

  return (
    <div className="space-y-8">
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone={statusTone(latestStatus)}>{latestStatus}</Badge>
            <CardTitle className="mt-4">{equipment.name}</CardTitle>
            <CardDescription>
              Inventário {equipment.inventoryNumber} - {equipment.brand} - {equipment.allocatedBase}
            </CardDescription>
            <p className="mt-3 text-sm text-slate-300">Localização atual: {equipment.currentLocation}</p>
          </div>
          <Link className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href="/equipments">
            Voltar para lista
          </Link>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Edição</CardTitle>
          <CardDescription>Atualize os dados do equipamento. Inventário continua único em toda a base.</CardDescription>
          <form className="mt-6 grid gap-4 lg:grid-cols-2" method="post" action={`/api/equipments/${equipment.id}`}>
            <div>
              <Label htmlFor="inventoryNumber">Nº inventário</Label>
              <Input id="inventoryNumber" name="inventoryNumber" defaultValue={equipment.inventoryNumber} required />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" defaultValue={equipment.brand} required />
            </div>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={equipment.name} required />
            </div>
            <div>
              <Label htmlFor="allocatedBase">Base alocada</Label>
              <Input id="allocatedBase" name="allocatedBase" defaultValue={equipment.allocatedBase} required />
            </div>
            <div>
              <Label htmlFor="currentLocation">Localização atual</Label>
              <Input id="currentLocation" name="currentLocation" defaultValue={equipment.currentLocation} required />
            </div>
            <div>
              <Label htmlFor="isContractual">Contratual</Label>
              <select id="isContractual" name="isContractual" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" defaultValue={String(equipment.isContractual)}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <Label htmlFor="contractCode">Código do contrato</Label>
              <Input id="contractCode" name="contractCode" defaultValue={equipment.contractCode ?? ''} />
            </div>
            <div>
              <Label htmlFor="contractStartAt">Início do contrato</Label>
              <Input id="contractStartAt" name="contractStartAt" type="date" defaultValue={toInputDate(equipment.contractStartAt ?? undefined)} />
            </div>
            <div>
              <Label htmlFor="contractEndAt">Fim do contrato</Label>
              <Input id="contractEndAt" name="contractEndAt" type="date" defaultValue={toInputDate(equipment.contractEndAt ?? undefined)} />
            </div>
            <div className="lg:col-span-2">
              <Button type="submit">Salvar alterações</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Disponibilidade no período</CardTitle>
          <CardDescription>O cálculo considera o último estado conhecido antes do período e assume indisponível se não houver histórico.</CardDescription>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" method="get">
            <div>
              <Label htmlFor="start">Início</Label>
              <Input id="start" name="start" type="datetime-local" defaultValue={toInputDateTime(periodStart)} />
            </div>
            <div>
              <Label htmlFor="end">Fim</Label>
              <Input id="end" name="end" type="datetime-local" defaultValue={toInputDateTime(periodEnd)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Recalcular</Button>
            </div>
          </form>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Card className="bg-white/5 p-4 shadow-none">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Disponível</p>
              <div className="mt-2 text-2xl font-semibold text-white">{availability.availableHours.toFixed(2)}h</div>
            </Card>
            <Card className="bg-white/5 p-4 shadow-none">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Indisponível</p>
              <div className="mt-2 text-2xl font-semibold text-white">{availability.unavailableHours.toFixed(2)}h</div>
            </Card>
            <Card className="bg-white/5 p-4 shadow-none">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dias disponíveis</p>
              <div className="mt-2 text-2xl font-semibold text-white">{availability.availableDays.toFixed(2)}</div>
            </Card>
            <Card className="bg-white/5 p-4 shadow-none">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Disponibilidade</p>
              <div className="mt-2 text-2xl font-semibold text-white">{availability.availabilityPercent.toFixed(2)}%</div>
            </Card>
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Novo evento de status</CardTitle>
        <CardDescription>Ao abrir um novo evento, o sistema encerra automaticamente o evento aberto anterior do mesmo equipamento.</CardDescription>
        <form className="mt-6 grid gap-4 lg:grid-cols-2" method="post" action={`/api/equipments/${equipment.id}/status-events`}>
          <input type="hidden" name="equipmentId" value={equipment.id} />
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" defaultValue="OPERATIONAL">
              <option value="OPERATIONAL">OPERATIONAL</option>
              <option value="BROKEN">BROKEN</option>
            </select>
          </div>
          <div>
            <Label htmlFor="startedAt">Início</Label>
            <Input id="startedAt" name="startedAt" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="endedAt">Fim</Label>
            <Input id="endedAt" name="endedAt" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={4} placeholder="Detalhes do incidente ou manutenção" />
          </div>
          <div className="lg:col-span-2">
            <Button type="submit">Registrar status</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Histórico de eventos</CardTitle>
        <div className="mt-6 overflow-hidden rounded-2xl">
          <Table>
            <thead>
              <tr>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Início</TableHeadCell>
                <TableHeadCell>Fim</TableHeadCell>
                <TableHeadCell>Observações</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {equipment.statusEvents.length === 0 ? (
                <tr>
                  <TableCell colSpan={4} className="py-10 text-center text-slate-400">
                    Nenhum evento registrado.
                  </TableCell>
                </tr>
              ) : (
                equipment.statusEvents.map((event) => (
                  <tr key={event.id} className="transition hover:bg-white/5">
                    <TableCell>
                      <Badge tone={statusTone(event.status)}>{event.status}</Badge>
                    </TableCell>
                    <TableCell>{format(event.startedAt, 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{event.endedAt ? format(event.endedAt, 'dd/MM/yyyy HH:mm') : 'Aberto'}</TableCell>
                    <TableCell>{event.notes ?? '-'}</TableCell>
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