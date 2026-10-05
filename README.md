# Controle Blue v2

Aplicação privada para Mark, Andressa e Sidney. Next.js 16 + TypeScript + Tailwind 4 + componentes Shadcn/Radix + Framer Motion + Recharts + Supabase Auth/PostgreSQL.

## Funcionalidades

- Dashboard financeiro, receitas/despesas, filtros por mês/categoria/responsável e relatório anual.
- Casa: R$ 80.000 de dívida, R$ 1.500 mensais, R$ 3.000 já pagos em 2 parcelas, R$ 77.000 restantes.
- 52 parcelas restantes: 51 de R$ 1.500 + última de R$ 500. Sem juros ou multas informados.
- Histórico com filtro por período; antecipações, edição/exclusão e projeção recalculada.
- Progresso animado, aviso quando restarem até 12 parcelas, vencimento configurável.
- Interface azul responsiva, navegação inferior, temas claro/escuro e estados vazios sem dados fictícios.
- Mark: administração, permissões, desativação, troca direta de senhas e CSV.
- Andressa (`user`): visualização e lançamento; edição/exclusão somente dos próprios registros.
- Sidney (`viewer`): somente casa; APIs negam alterações mesmo por requisição manual.

## 1. Criar um banco Supabase dedicado

Use um novo projeto para evitar conflito com o schema legado de `profiles` e preservar os snapshots anteriores. Não execute este SQL sobre o banco de outro aplicativo.

No SQL Editor, execute **supabase/blue/schema.sql**, uma vez. Ele cria:

- `profiles`: UUID de `auth.users`, nome, username fixo, role, `is_first_login`, ativação e estado ativo.
- `casa_controle`: valor total/parcela, meses equivalentes pagos, dia de vencimento e saldo inicial.
- `casa_pagamentos`: valor, data, mês de referência, autor e observação.
- `gastos`: despesas e receitas em centavos, com categoria e autor.
- `blue_private`: sessões, limites de tentativa, auditoria e controle de concorrência das credenciais.

Valores monetários são armazenados em centavos inteiros. Colunas `valor_total`, `valor_parcela` e `valor` expõem equivalentes numéricos em reais. `data_inicio` é nula até que haja uma data real; o sistema não inventa datas para os R$ 3.000 iniciais. O vencimento começa no dia 10 e pode ser alterado pelo Mark.

Em Authentication → Providers, mantenha Email habilitado e **desative Allow new users to sign up**. Desative login anônimo e provedores OAuth não utilizados. O provisionamento administrativo continua possível.

## 2. Configurar segredos

Crie `.env.local` na raiz, sem versionar:

```env
BLUE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
BLUE_SUPABASE_SERVICE_ROLE_KEY=CHAVE_SERVICE_ROLE_DO_PROJETO
BLUE_SITE_URL=https://controle-blue.vercel.app
```

Encontre a URL e a chave server-side no painel do projeto Supabase. Nunca use `NEXT_PUBLIC_` para a chave. Nunca envie a chave pelo WhatsApp, coloque no GitHub ou inclua em screenshots.

No projeto **controle** da Vercel, configure as duas primeiras variáveis em Production e Preview. `BLUE_SITE_URL` só é necessário ao provisionar convites fora do domínio padrão.

## 3. Criar as três contas iniciais

Requer Node.js 20+ (Vercel configurada com Node 24):

```bash
npm ci
npm run provision
```

O script `scripts/provision-blue.mjs` usa exclusivamente Supabase Auth Admin para criar as contas. As senhas iniciais e endereços internos são aleatórios; não são divulgados. Os endereços servem como identificadores privados de autenticação, não como caixas de e-mail.

O script grava um convite de uso único do Mark em `.blue-mark-activation.txt`. Abra esse link em seu navegador em até 7 dias; ele conduz a `/auth/setup-password`. Crie sua senha definitiva (mínimo 10 caracteres, máximo 72 bytes UTF-8). Ao salvar, `is_first_login` muda para false e uma sessão privada é iniciada.

Depois de entrar como Mark, abra **Configurações → Pessoas e permissões**. Gere um convite para Andressa e outro para Sidney. Cada pessoa abre seu convite e cria a própria senha. Depois disso, o login usa somente o nome de usuário e a senha pessoal.

Executar o provisionamento novamente preserva senhas e permissões existentes. Se Mark ainda não ativou, o script substitui seu convite anterior por um novo. Exclua o arquivo privado após usar o link.

Se você optar por criar as contas manualmente em Supabase Auth, use o UUID de cada conta ao inserir os perfis com usernames exatos e roles corretos. O script é recomendado porque também cria os convites com hash e expiração e evita divulgar credenciais temporárias.

## 4. Senhas e sessão

Supabase Auth valida e armazena as senhas. O servidor entrega ao navegador apenas um identificador aleatório em cookie HttpOnly, Secure em produção, SameSite=Strict. JWTs e refresh tokens do Supabase não são entregues ao browser; ficam no servidor. Isso mantém a alteração de senha exclusivamente nos endpoints controlados da aplicação.

O login verifica o perfil. Se `is_first_login=true`, o acesso aos dados é bloqueado e o usuário é enviado para `/auth/setup-password`. Convites permitem chegar diretamente à tela sem compartilhar uma senha temporária. Tokens no fragmento do link não são enviados em Referer; são removidos da barra após a leitura.

Depois da ativação, somente o **UUID do perfil reservado `mark`** pode chamar `/api/admin/reset-password`. A API confirma a identidade de uma sessão válida, role e o vínculo do UUID ao username imutável. A nova senha é aplicada por `auth.admin.updateUserById`; todas as sessões do usuário são revogadas. Não há link de recuperação pública ou de alteração própria para Andressa e Sidney. Mark também pode alterar sua própria senha, encerrando sua sessão.

As sessões expiram em 30 dias. Permissões e desativação são consultadas novamente no banco a cada chamada; não dependem de claims antigas. Sair remove a sessão no banco e o cookie.

## 5. Segurança de dados

RLS habilitada em todas as tabelas. Perfis não permitem autoatribuição de papel. Sem privilégios de escrita direta para anon/authenticated: pagamentos passam por uma RPC transacional server-side, protegida por sessão e autorização. As policies de INSERT especificam `admin/user` e autoria, sem conceder um caminho para contornar saldo, auditoria e bloqueio de concorrência.

- Nenhum fallback local aberto quando falta configuração.
- Nenhuma sincronização de snapshots integrais que permitiria apagar dados de outra pessoa.
- Bloqueio global da casa (`FOR UPDATE`) serializa pagamentos e mudanças de configuração, evitando saldo negativo.
- IDs estáveis tornam um novo envio do mesmo pagamento idempotente.
- Lease de credenciais impede dois pedidos simultâneos de ativação/reset.
- Limite de tentativas de login persistido no PostgreSQL, válido em múltiplas instâncias da Vercel.
- CSV neutraliza descrições que poderiam virar fórmulas.
- Nenhum dado financeiro persistido em localStorage; somente a preferência de tema.
- O service worker anterior é removido; respostas privadas têm `Cache-Control: no-store`.

A auditoria registra alterações, autor e identificador. Não armazena senhas ou tokens em texto puro.

## 6. Desenvolvimento e verificações

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Rotas: `/`, `/dashboard`, `/gastos`, `/casa`, `/relatorios`, `/configuracoes`, `/login`, `/auth/setup-password`.

As APIs antigas de cadastro e sincronização foram removidas. `/cadastro` redireciona para login e `/transacoes` para gastos. A branch `main` anterior preserva o aplicativo legado e seu histórico; nenhum snapshot é importado automaticamente, pois a autoria de registros antigos não foi informada.

Os módulos antigos de Moto/Loja não fazem parte da navegação desta reconstrução. Seus snapshots anteriores não são apagados. Para migrar finanças antigas, exporte o backup anterior e faça uma migração explícita com confirmação de autoria.

## 7. Publicar mantendo o domínio

1. Configure o banco, execute o SQL e provisione as três contas.
2. Configure as variáveis no projeto Vercel **controle**.
3. Valide a branch `v2-chernobyl` em um deployment Preview.
4. Verifique primeiro login, permissões e pagamento usando contas reais.
5. Promova o deployment validado para Production ou integre a branch à branch de produção.
6. O projeto existente mantém `controle-blue.vercel.app`.

Rollback: restaure o deployment anterior da Vercel. As novas tabelas são independentes dos snapshots legados. Não elimine dados anteriores para aplicar a reconstrução.

Notificações por e-mail não fazem parte desta versão: não há e-mails reais dos três titulares ou serviço de envio configurado. Redefinição de senha usa a API administrativa direta solicitada.
