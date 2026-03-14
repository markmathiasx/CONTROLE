# ControLê

Hub pessoal mobile-first em `pt-BR` para acompanhar finanças, operação da moto e rotina da loja de impressão 3D em um só PWA. A base continua local-first, funciona sem Supabase e já nasce preparada para sincronização opcional por snapshot remoto.

## Módulos

- `Resumo`: hub consolidado com visão geral de `Financeiro`, `Moto` e `Loja`
- `Financeiro`: caixa do mês, VR, cartão, parcelas, orçamentos, transações e relatórios
- `Moto`: abastecimentos, manutenções, custos mensais e próximos cuidados
- `Loja`: estoque de filamentos/insumos, produção, pedidos e lucro operacional

## Stack

- Next.js 16 com App Router e typed routes
- TypeScript
- Tailwind CSS v4
- shadcn/ui style components
- React Hook Form + Zod
- Zustand
- date-fns
- Recharts
- Lucide Icons
- `@ducanh2912/next-pwa`
- Supabase opcional para sync remoto
- Vitest

## Arquitetura

```text
app/                  rotas, layout, manifest, APIs
components/           shell, primitives e componentes compartilhados
features/             páginas por domínio (finance, moto, store, reports, hub)
store/                Zustand store e mutações de domínio
types/                tipos de domínio e formulários
lib/                  constantes, schemas, env, formatação e migrações
utils/                seed, cálculos financeiros, operações e parser rápido
adapters/             persistência local e remota
services/             helpers server-side, lock opcional e Supabase
tests/                testes unitários
supabase/schema.sql   tabela mínima para snapshot remoto
```

## Estrutura de dados v2

O snapshot principal usa `schemaVersion = 2` e centraliza:

- `costCenters`: `me`, `partner`, `shared`, `moto`, `store`
- `transactions` e `incomes` com `centerId`, `originModule`, `originRefId` e `lockedByOrigin`
- `vehicles`, `fuelLogs`, `maintenanceLogs`
- `filamentSpools`, `supplyItems`, `stockMovements`
- `productionJobs`, `productionMaterialUsages`, `storeOrders`
- `operationalSettings` para energia e acabamento da loja

Snapshots antigos v1 são migrados automaticamente para v2 antes da validação.

## Como rodar

```bash
npm install
npm run dev
```

Scripts disponíveis:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Modo local sem Supabase

Se as variáveis do Supabase não estiverem preenchidas, o app funciona normalmente em modo local:

- persistência principal em `IndexedDB`
- compatibilidade automática com snapshot legado salvo em `localStorage`
- seed inicial carregada no primeiro boot
- uso offline/local preservado pelo PWA

Esse é o modo ideal para começar imediatamente. A limitação é que os dados ficam só neste navegador/dispositivo.

## Sync opcional com Supabase

Quando estas variáveis existirem, o app passa a sincronizar o snapshot remoto:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_LOCK_PIN=
```

Passos:

1. Copie `.env.example` para `.env.local`
2. Crie um projeto no Supabase
3. Rode o SQL de `supabase/schema.sql`
4. Preencha as variáveis acima

Notas importantes:

- o client usa apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` é usado só no server, via `app/api/sync/route.ts`
- o app continua salvando localmente primeiro e sincroniza depois
- a estratégia atual de conflito é `last-write-wins`
- `APP_LOCK_PIN` é opcional, mas recomendado em deploy público

## Rotas principais

- `/`: hub consolidado
- `/financeiro`: dashboard financeiro dedicado
- `/transacoes`
- `/transacoes/nova`
- `/cartoes`
- `/parcelas`
- `/categorias`
- `/orcamentos`
- `/relatorios`
- `/configuracoes`
- `/moto`
- `/moto/abastecimentos`
- `/moto/manutencoes`
- `/loja`
- `/loja/estoque`
- `/loja/producao`
- `/loja/pedidos`

## Financeiro

O módulo financeiro mantém a base do MVP e agora conversa com os demais centros sem misturar a leitura:

- saldo do mês
- saldo de VR separado
- fatura atual e parcelas futuras
- transações com filtros por centro, categoria e forma de pagamento
- cartões, recorrências e orçamentos
- parser rápido com entradas como `300 credito 3x mercado casal`
- consolidado geral sem dupla contagem de moto e loja

## Moto

O módulo da moto foi pensado para uso operacional simples e real:

- cadastro da Honda CG 160 2021 na seed
- abastecimento com cálculo bidirecional entre `valor`, `preço/litro` e `litros`
- atualização de odômetro
- histórico de abastecimentos
- histórico de manutenção
- categorias como troca de óleo, pneu, freio, revisão e documentação
- próximos cuidados derivados por meses/km

Cada abastecimento e manutenção gera ou atualiza a despesa financeira vinculada ao centro `moto`.

## Loja / Impressão 3D

O módulo da loja cobre o fluxo operacional básico da Bambu Lab A1 Mini:

- compra agrupada de filamentos com divisão automática de custo
- custo por rolo e custo por grama calculados
- cadastro de insumos de pintura/acabamento
- baixa automática de estoque em produção
- cálculo de desperdício em gramas e em reais
- cálculo de energia, acabamento, embalagem e custo extra manual
- pedidos com status e reconhecimento de receita apenas quando entregues

### Cadastro de filamento

Em `/loja/estoque`, informe:

- data
- custo total
- peso total em gramas
- quantidade de rolos
- material, cor, marca e fornecedor

O sistema divide o custo entre os rolos e registra movimentações de entrada automaticamente.

### Registro de consumo e produção

Em `/loja/producao`, monte a produção com:

- peça
- data
- quantidades produzida e vendida
- horas de impressão
- horas de acabamento
- materiais usados
- desperdício por material
- custos extras
- preço de venda

O sistema reduz o estoque, calcula:

- custo do material
- custo do desperdício
- custo de energia
- custo de acabamento
- custo de embalagem
- custo total
- custo unitário
- lucro bruto
- margem

### Registro de pedidos

Em `/loja/pedidos`, cadastre pedidos manuais com vínculo opcional a uma produção.

- `budget`
- `in-production`
- `ready`
- `delivered`
- `cancelled`

Quando o pedido entra como `delivered`, a receita financeira é gerada no centro `store`.

## Configurações operacionais

Em `/configuracoes`, além dos parâmetros financeiros, você encontra:

- salário mensal
- VR mensal
- dia de entrada de salário e VR
- tema
- centros ativos
- tarifa de energia por kWh
- potência média da impressora
- custo fixo extra por produção
- custo manual por hora de acabamento
- exportação/importação de backup
- reset para seed

## Backup e importação

O app exporta e importa o snapshot inteiro em JSON.

Fluxos disponíveis em `/configuracoes`:

- `Exportar backup`
- `Importar backup`
- `Resetar para seed`

## PWA

O projeto continua instalável como aplicativo:

- manifest via `app/manifest.ts`
- service worker gerado pelo `next-pwa`
- fallback offline em `~offline`
- navegação inferior fixa e FAB com speed-dial
- shell pensada para uso com uma mão no celular

## Deploy

Para subir em ambiente hospedado:

1. publique o repositório
2. configure as variáveis de ambiente
3. faça o deploy em Vercel ou ambiente compatível com Next.js

Sem Supabase, o app segue funcional em modo local. Com Supabase, o snapshot passa a sincronizar entre dispositivos do mesmo workspace.

## Seed inicial

A seed de demonstração já inclui:

- salário `R$ 2.000`
- VR `R$ 800`
- centros `Eu`, `Namorada`, `Casal`, `Moto`, `Loja`
- dois cartões de exemplo
- gastos financeiros pessoais e compartilhados
- compra parcelada no crédito
- Honda CG 160 2021 com abastecimento e manutenção
- filamentos, insumos, produção e pedido da loja

## Validação executada

Os comandos abaixo devem passar no estado atual do projeto:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Próximos passos naturais

- autenticação real por usuário/workspace
- sync remoto mais granular que snapshot único
- dashboards analíticos mais profundos para loja e moto
- multi-workspace explícito na interface
- branding configurável para evolução futura
