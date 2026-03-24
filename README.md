# Equipment Control System

Aplicação web para cadastrar equipamentos, registrar eventos de status operacional/avaria e calcular disponibilidade por período.

## Visão geral

O projeto foi implementado com:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod para validação
- Vitest para testes unitários

O sistema possui:

- cadastro e manutenção de equipamentos
- histórico de eventos `OPERATIONAL` e `BROKEN`
- dashboard com filtros e métricas por período
- exportação CSV do relatório filtrado

## Requisitos atendidos

- Cadastro de equipamentos com inventário único, marca, nome, base, localização e dados contratuais opcionais
- Listagem, busca, visualização e edição de equipamentos
- Registro de eventos de status por equipamento
- Bloqueio de sobreposição inconsistente de períodos
- Encerramento automático do evento aberto anterior quando um novo evento é criado
- Cálculo de disponibilidade e indisponibilidade em horas, dias e percentual
- Dashboard com filtros por período, base, marca e busca textual
- Exportação CSV com os filtros aplicados
- API server-side com validação Zod
- Prisma schema, migration inicial e seed com dados de exemplo
- Testes unitários para cálculo de disponibilidade e transições críticas de status

## Regra de cálculo

O cálculo considera cada evento como um ponto de mudança de estado e avalia a janela solicitada em intervalos contínuos.

- `OPERATIONAL` conta como disponível
- `BROKEN` conta como indisponível
- se o período começar sem evento dentro da janela, o sistema usa o último estado conhecido anterior ao início da janela
- se não existir histórico algum para o equipamento, o período é tratado como indisponível
- os valores de horas, dias e percentual são arredondados para 2 casas decimais

Essa decisão está documentada no código em [lib/availability.ts](lib/availability.ts) e refletida nos testes em [tests/availability.test.ts](tests/availability.test.ts).

## Estrutura principal

- [app/page.tsx](app/page.tsx) - dashboard
- [app/equipments/page.tsx](app/equipments/page.tsx) - listagem e cadastro
- [app/equipments/[id]/page.tsx](app/equipments/%5Bid%5D/page.tsx) - detalhe, edição e eventos
- [app/api/equipments/route.ts](app/api/equipments/route.ts) - criação e listagem
- [app/api/equipments/[id]/route.ts](app/api/equipments/%5Bid%5D/route.ts) - leitura e atualização
- [app/api/equipments/[id]/status-events/route.ts](app/api/equipments/%5Bid%5D/status-events/route.ts) - eventos de status
- [app/api/dashboard/route.ts](app/api/dashboard/route.ts) - relatório JSON
- [app/api/dashboard/export/route.ts](app/api/dashboard/export/route.ts) - exportação CSV
- [prisma/schema.prisma](prisma/schema.prisma) - schema do banco
- [prisma/seed.ts](prisma/seed.ts) - dados de exemplo

## Setup local

1. Copie o arquivo de ambiente:

```bash
copy .env.example .env
```

2. Ajuste `DATABASE_URL` para seu PostgreSQL local.

3. Instale dependências:

```bash
npm install
```

4. Gere o client do Prisma:

```bash
npx prisma generate
```

5. Aplique a migration inicial:

```bash
npx prisma migrate dev
```

6. Carregue os dados de exemplo:

```bash
npm run prisma:seed
```

7. Inicie a aplicação:

```bash
npm run dev
```

## Uso

- acesse `/` para ver o dashboard
- acesse `/equipments` para cadastrar e procurar equipamentos
- abra um equipamento para editar seus dados e registrar eventos de status
- use o filtro do dashboard para gerar o CSV em `/api/dashboard/export`

## Testes

Executar a suíte unitária:

```bash
npm test
```

Os testes cobrem:

- períodos sem histórico completo, tratados como indisponíveis
- transições com histórico anterior ao período
- autoencerramento do evento aberto anterior
- rejeição de sobreposição de períodos

## Observações de implementação

- As rotas server-side aceitam `form-data` e JSON.
- A interface foi montada com Tailwind e componentes reutilizáveis em [components/ui.tsx](components/ui.tsx).
- A aplicação usa páginas server-rendered para simplificar o fluxo sem depender de client state desnecessário.

## Critérios de aceite

- é possível cadastrar equipamentos com os campos solicitados
- é possível registrar mudanças de status e manter histórico consistente
- o dashboard mostra métricas por período
- a exportação CSV respeita os filtros aplicados
- o projeto roda localmente com PostgreSQL e Prisma
