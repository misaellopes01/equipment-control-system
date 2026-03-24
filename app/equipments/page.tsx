import Link from 'next/link';
import { Badge, Button, Card, CardDescription, CardTitle, Input, Label, Notice, Table, TableCell, TableHeadCell } from '@/components/ui';
import { listEquipments } from '@/lib/report';

function valueOf(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EquipmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const message = valueOf(resolvedSearchParams, 'message');
  const error = valueOf(resolvedSearchParams, 'error');
  const query = valueOf(resolvedSearchParams, 'q') ?? '';
  const brand = valueOf(resolvedSearchParams, 'brand') ?? '';
  const allocatedBase = valueOf(resolvedSearchParams, 'allocatedBase') ?? '';
  const equipments = await listEquipments({ search: query || undefined, brand: brand || undefined, allocatedBase: allocatedBase || undefined });

  return (
    <div className="space-y-8">
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Card>
        <CardTitle>Cadastro de equipamentos</CardTitle>
        <CardDescription>Crie novos equipamentos com inventário único, dados contratuais opcionais e localização atual.</CardDescription>
          <form className="mt-6 grid gap-4 lg:grid-cols-2" method="post" action="/api/equipments">
          <div>
            <Label htmlFor="inventoryNumber">Nº inventário</Label>
            <Input id="inventoryNumber" name="inventoryNumber" required />
          </div>
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" name="brand" required />
          </div>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="allocatedBase">Base alocada</Label>
            <Input id="allocatedBase" name="allocatedBase" required />
          </div>
          <div>
            <Label htmlFor="currentLocation">Localização atual</Label>
            <Input id="currentLocation" name="currentLocation" required />
          </div>
          <div>
            <Label htmlFor="isContractual">Contratual</Label>
            <select id="isContractual" name="isContractual" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" defaultValue="false">
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </select>
          </div>
          <div>
            <Label htmlFor="contractCode">Código do contrato</Label>
            <Input id="contractCode" name="contractCode" placeholder="Opcional" />
          </div>
          <div>
            <Label htmlFor="contractStartAt">Início do contrato</Label>
            <Input id="contractStartAt" name="contractStartAt" type="date" />
          </div>
          <div>
            <Label htmlFor="contractEndAt">Fim do contrato</Label>
            <Input id="contractEndAt" name="contractEndAt" type="date" />
          </div>
          <div className="lg:col-span-2">
            <Button type="submit">Criar equipamento</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Busca e manutenção</CardTitle>
        <CardDescription>Use os filtros para localizar equipamentos e acessar a página de detalhe para edição e eventos.</CardDescription>
        <form className="mt-6 grid gap-4 lg:grid-cols-4" method="get">
          <div>
            <Label htmlFor="q">Busca</Label>
            <Input id="q" name="q" defaultValue={query} placeholder="Inventário, nome, localização" />
          </div>
          <div>
            <Label htmlFor="brandFilter">Marca</Label>
            <Input id="brandFilter" name="brand" defaultValue={brand} />
          </div>
          <div>
            <Label htmlFor="baseFilter">Base</Label>
            <Input id="baseFilter" name="allocatedBase" defaultValue={allocatedBase} />
          </div>
          <div className="flex items-end">
            <Button type="submit">Filtrar</Button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-2xl">
          <Table>
            <thead>
              <tr>
                <TableHeadCell>Inventário</TableHeadCell>
                <TableHeadCell>Nome</TableHeadCell>
                <TableHeadCell>Marca</TableHeadCell>
                <TableHeadCell>Base</TableHeadCell>
                <TableHeadCell>Contrato</TableHeadCell>
                <TableHeadCell>Ações</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {equipments.length === 0 ? (
                <tr>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </tr>
              ) : (
                equipments.map((equipment) => (
                  <tr key={equipment.id} className="transition hover:bg-white/5">
                    <TableCell className="font-medium text-white">{equipment.inventoryNumber}</TableCell>
                    <TableCell>{equipment.name}</TableCell>
                    <TableCell>{equipment.brand}</TableCell>
                    <TableCell>{equipment.allocatedBase}</TableCell>
                    <TableCell>
                      <Badge tone={equipment.isContractual ? 'success' : 'neutral'}>{equipment.isContractual ? 'Sim' : 'Não'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href={`/equipments/${equipment.id}`}>
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