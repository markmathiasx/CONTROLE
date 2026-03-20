# Controle Financeiro MMSVH

Hub pessoal em `pt-BR` para `Financeiro`, `Moto` e `Loja`, agora com autenticação real por Supabase Auth, sincronização em nuvem por workspace e fallback local preservado. O app continua mobile-first, PWA e pronto para uso no celular e no desktop com a mesma conta.

## O que existe no app

- `Resumo`: hub consolidado com visão geral dos 3 módulos
- `Financeiro`: saldo do mês, VR, cartão, parcelas, transações, categorias, orçamentos e relatórios
- `Moto`: abastecimentos, manutenções, custo mensal e próximos cuidados
- `Loja`: catálogo com carrinho, estoque de filamentos/insumos, produção, pedidos e lucro operacional
- `Auth + Cloud`: login, cadastro, logout, sessão persistente, rotas protegidas, cache local e sync por workspace
- `IA opcional`: leitura financeira comentada no relatório, server-side only, sem chave no client

### Polimento UX recente

- telas de login/cadastro com validações reforçadas, toggle de senha e feedback de força
- catálogo com filtros rápidos por chips, quick view e carrinho persistente
- painéis flutuantes com auto-recolhimento por inatividade para reduzir poluição visual
- refinamentos visuais com camadas glass/aurora e microinterações mobile-first

## Stack

- Next.js 16 com App Router e typed routes
- TypeScript
- Tailwind CSS v4
- componentes estilo shadcn/ui
- React Hook Form + Zod
- Zustand
- date-fns
- Recharts
- Lucide Icons
- `@ducanh2912/next-pwa`
- Supabase Auth + Postgres + Realtime
- OpenAI Responses API opcional para revisão financeira assistida
- Vitest

## Arquitetura

```text
app/                  rotas, layouts, manifest e APIs
components/           shell, providers, primitives e componentes compartilhados
features/             páginas e blocos por domínio
store/                auth store + snapshot store
types/                tipos de domínio e formulários
lib/                  constants, env, schemas e migrações do snapshot
utils/                seed, cálculos, merge local->nuvem e operações
adapters/             persistência local (IndexedDB) e nuvem (Supabase)
services/             helpers do Supabase e lock opcional
supabase/schema.sql   schema, trigger e RLS
tests/                testes unitários
```

## Modelo atual

### Snapshot do domínio

Finanças, moto e loja continuam em um `workspace_snapshot` versionado com `schemaVersion = 3`.

Isso inclui:

- `costCenters`: `me`, `partner`, `shared`, `moto`, `store`
- `transactions`, `incomes`, `installments`, `budgets`, `creditCards`
- `vehicles`, `fuelLogs`, `maintenanceLogs`
- `filamentSpools`, `supplyItems`, `stockMovements`
- `productionJobs`, `productionMaterialUsages`, `storeOrders`
- `settings`, `operationalSettings` e metadados de migração/sync

Snapshots antigos `v1` e `v2` são migrados automaticamente.

### Camada relacional no Supabase

O Supabase guarda identidade e permissão em tabelas próprias:

- `profiles`
- `workspaces`
- `workspace_members`
- `user_settings`
- `workspace_snapshots`

Essa camada já deixa a base pronta para futuro compartilhamento entre você e sua namorada sem reestruturar o app depois.

## Multiusuário e workspace compartilhado

O app continua ótimo para uso individual, mas a base agora já está pronta para crescer sem retrabalho.

### O que já está pronto

- um usuário pode ter mais de um `workspace`
- cada `workspace` pode ser `pessoal` ou `compartilhado`
- a sessão mantém um `active_workspace_id`
- a UI já permite trocar de contexto entre workspaces
- a criação de um workspace compartilhado já funciona para o owner atual

### O que ainda fica para depois

- convite por e-mail
- aceitar/rejeitar convite
- gestão completa de membros pela UI

Isso foi intencional para manter o projeto sólido agora, sem adicionar complexidade desnecessária.

## Como rodar

```bash
npm install
npm run dev
```

Scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Modo local vs modo nuvem

### Modo local

Se as envs do Supabase não existirem, o app entra automaticamente em `modo local`.

Nesse modo:

- não exige login
- persiste em `IndexedDB`
- mantém compatibilidade com snapshot legado do `localStorage`
- continua funcionando como PWA neste aparelho

Esse modo é ideal para começar imediatamente ou usar offline, mas os dados ficam restritos ao navegador atual.

### Modo nuvem

Se `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` estiverem configuradas:

- `/` vira entry pública com login/cadastro
- o usuário autenticado recebe um workspace pessoal automaticamente
- o app sincroniza o snapshot do workspace com o Supabase
- o cache local continua existindo para velocidade e recuperação
- o status visual mostra `Sincronizando`, `Sincronizado` ou `Erro de sync`
- quando a conexão oscila, o app tenta retomar a sincronização automaticamente em foco, reconexão e intervalos curtos

## Configurando Supabase

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_LOCK_PIN=
```

Regras:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são usados no browser
- `SUPABASE_SERVICE_ROLE_KEY` fica só no server
- `APP_LOCK_PIN` é opcional e adiciona uma trava extra ao deploy
- `OPENAI_API_KEY` fica só no server
- `OPENAI_RESPONSES_MODEL` é opcional e permite trocar o modelo usado na leitura IA

### 2. SQL do projeto

No painel do Supabase, rode o conteúdo de:

`supabase/schema.sql`

Esse SQL cria:

- `profiles`
- `workspaces`
- `workspace_members`
- `user_settings`
- `workspace_snapshots`
- funções auxiliares de membership
- trigger em `auth.users`
- RLS e policies por workspace

Policies aplicadas:

- `profiles`: leitura e edição apenas do próprio usuário
- `workspaces`: leitura para membros; update para owner
- `workspace_members`: leitura do próprio membership e gestão futura pelo owner
- `user_settings`: leitura e edição apenas da própria linha
- `workspace_snapshots`: `select`, `insert` e `update` apenas para membros do workspace

### 3. Auth

O app usa `Supabase Auth`.

No painel do Supabase:

- ative `Email + Password`
- para reduzir atrito no MVP, a recomendação é deixar a confirmação de e-mail desativada
- se você preferir confirmação de e-mail, a UI já suporta esse estado

### 4. Realtime

Para que a atualização entre dispositivos fique mais fluida, deixe `workspace_snapshots` disponível para Realtime no projeto Supabase.

## Login, cadastro e logout

Rotas públicas de autenticação:

- `/login`
- `/cadastro`
- `/logout`
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/logout`

As telas públicas de autenticação mostram explicitamente se o ambiente está em `Modo local` ou `Modo nuvem`, para deixar claro quando o login está ativo ou quando o app continua rodando só no dispositivo.

### Cadastro

O cadastro pede:

- `login` único
- `nome de exibição`
- `e-mail`
- `senha`

Ao cadastrar:

- a senha fica somente no Supabase Auth
- o sistema cria `profile`
- cria um `workspace` pessoal
- cria `workspace_member` como `owner`
- cria `user_settings`

### Login

O login aceita:

- `login`
- ou `e-mail`

Quando você entra com `login`, o server resolve `username -> email` com segurança e depois autentica pelo Supabase Auth.

### Logout

O logout encerra a sessão real, limpa o estado local da conta e volta para `/login`.

## Leitura IA opcional

O relatório consolidado agora pode gerar uma leitura comentada com IA.

### O que ela faz

- resume o fechamento no período selecionado
- aponta prioridades e cortes mais prováveis
- sugere próximos passos
- considera custo do automóvel, maior gasto e comparativo do mês

### Como funciona

- a UI envia apenas o resumo consolidado do relatório
- o endpoint server-side chama a OpenAI via `Responses API`
- a chave fica somente no servidor
- sem `OPENAI_API_KEY`, o botão continua visível mas a função fica desativada com mensagem clara

### Env da IA

Adicione no servidor:

```env
OPENAI_API_KEY=
OPENAI_RESPONSES_MODEL=gpt-5.4
```

O endpoint usado é:

- `/api/ai/financial-review`

## Migração dos dados locais para a conta

No primeiro login em um aparelho que já tem dados locais, o app abre um onboarding com duas opções:

- `Mesclar meus dados locais`
- `Começar só com a nuvem`

Esse onboarding fica bloqueando o fluxo até você decidir, para evitar ambiguidade entre o cache local do aparelho e o workspace da conta.

Se você mesclar, o sistema tenta importar:

- transações e receitas
- categorias, cartões, parcelas e orçamentos
- dados de moto
- estoque, produção e pedidos da loja
- configurações relevantes

O merge usa dedupe por `id` e por chaves semânticas para evitar duplicação grosseira.

## Como usar no celular e no PC com a mesma conta

1. configure o Supabase
2. faça login no celular
3. faça login no desktop com a mesma conta
4. aguarde o status `Sincronizado`

O app mantém cache local em cada dispositivo, então ele continua responsivo e recupera alterações quando a conexão volta.

## Módulo Financeiro

Mantém a base do MVP e agora funciona por `workspace`:

- saldo do mês
- VR separado
- cartão e parcelas futuras
- transações por centro de custo
- recorrências
- categorias
- orçamentos
- relatórios

O parser rápido continua aceitando entradas como:

- `30 credito cigarro`
- `18 vr almoço`
- `42 pix bebida namorada`
- `300 credito 3x mercado casal`

## Módulo Moto

Em `/moto`:

- abastecimentos com cálculo bidirecional entre valor, litros e preço/litro
- manutenção com categorias e recorrência simples
- presets nacionais populares (2016+) para carro e moto com consumo médio e custos fixos anuais de referência
- checklist rápido de peças/serviços por veículo com faixa de custo sugerida
- atualização do odômetro
- custo mensal da moto
- próximos cuidados

Cada registro também impacta o consolidado financeiro pelo centro `moto`.

## Módulo Loja

Em `/loja`:

- catálogo em `/loja/catalogo` com filtros, quick view, carrinho persistente e CTA para pedido/WhatsApp
- compra agrupada de filamentos
- custo por rolo e por grama
- insumos de pintura/acabamento
- baixa automática de estoque em produção
- desperdício em gramas e em reais
- custo de energia, embalagem e acabamento
- produção com custo unitário, lucro bruto e margem
- pedidos com reconhecimento de receita ao entregar

### Cadastro de filamento

Em `/loja/estoque`, informe:

- data
- custo total
- peso total em gramas
- quantidade de rolos
- material, cor, marca e fornecedor

O sistema divide o custo, cria os rolos e registra as movimentações de estoque.

### Produção

Em `/loja/producao`, informe:

- nome da peça
- quantidades produzida e vendida
- horas de impressão e acabamento
- materiais usados
- desperdício
- custos extras
- preço de venda

O sistema calcula:

- custo do material
- custo do desperdício
- custo de energia
- custo de acabamento
- custo de embalagem
- custo total
- custo unitário
- lucro bruto
- margem

## Configurações

Em `/configuracoes` você pode editar:

- perfil do usuário
- nome do workspace ativo
- criação de novos workspaces pessoais ou compartilhados
- troca de contexto entre workspaces
- salário mensal
- VR mensal
- dia de salário e VR
- tema
- centros ativos
- energia por kWh
- potência média da impressora
- custo fixo por produção
- custo manual por hora
- export/import de backup
- reset para seed

Quando estiver em nuvem, o tema e o onboarding ficam vinculados ao usuário em `user_settings`.

### Troca de contexto

Com Supabase ativo, o menu da conta e a tela de configurações mostram os workspaces disponíveis.

Você pode:

- alternar entre workspaces sem sair da conta
- manter um espaço pessoal e outro compartilhado
- renomear o workspace ativo
- criar um workspace compartilhado e deixar a estrutura pronta para adicionar sua namorada depois

## Backup e recuperação

O app exporta e importa o snapshot inteiro em JSON.

Fluxos:

- `Exportar backup`
- `Importar backup`
- `Resetar para seed`

Mesmo no modo nuvem, o cache local continua existindo para recuperação e fluidez.

## PWA

O projeto continua instalável:

- `manifest` em `app/manifest.ts`
- service worker gerado por `next-pwa`
- fallback offline em `/~offline`
- navegação inferior mobile
- FAB com speed-dial

## Deploy na Vercel

### Variáveis

No projeto da Vercel, configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_LOCK_PIN` opcional

Cloud mode só é ativado quando as 3 variáveis do Supabase estiverem presentes. Se faltar qualquer uma delas, o app volta automaticamente para o modo local.

### Checklist final de deploy

Antes de publicar ou redeployar:

- rode `npm run typecheck`
- rode `npm run lint`
- rode `npm test`
- rode `npm run build`
- confirme as envs da Vercel
- confirme o SQL mais recente em `supabase/schema.sql`
- valide login, troca de workspace e sync em dois dispositivos

### Redeploy

Depois de ajustar envs:

1. faça commit
2. envie para o repositório
3. redeploy na Vercel

Se você mudar schema ou auth no Supabase, é recomendado fazer um novo deploy para garantir alinhamento do build com as envs.

## Segurança

- `service_role` nunca vai para o browser
- login por username é resolvido no server
- senhas ficam só no Supabase Auth
- `workspace_snapshots` usam RLS
- tabelas de perfil/workspace também usam RLS
- o fallback local continua funcionando sem segredos

## Acessibilidade e UX

Nesta fase o app também foi polido para uso real:

- labels explícitos nos campos críticos
- ações de conta e workspace com foco melhor para mobile
- troca de contexto sem esconder o estado ativo
- estados de modo local, nuvem e sincronização visíveis
- estrutura pronta para evolução posterior sem quebrar o uso atual

## Validação executada

Os comandos abaixo passaram nesta versão:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
