# Controle Blue v2 — validação e publicação

## Evidência funcional

- 69 testes passaram: cálculo da dívida, centavos, última parcela de R$ 500, antecipações, CSV, autorização das rotas e schema PostgreSQL com pgcrypto.
- SQL completo executado em PostgreSQL/PGlite, sem substituir regras de negócio por mocks.
- Testes no banco: viewer bloqueado, autoria forçada pelo servidor, repetição idempotente, pagamentos acima do saldo rejeitados, permissões revogam sessões, primeira ativação de uso único, lease de credenciais e reset exclusivo do Mark.
- TypeScript, ESLint e build de produção passaram.
- O schema também foi aplicado no novo Supabase `controle-blue`, região São Paulo.
- Consulta ao banco hospedado confirmou total R$ 80.000, já pago R$ 3.000, saldo R$ 77.000 e 52 parcelas restantes.
- Advisors de segurança não apontaram erros/warnings. Os quatro avisos informativos de RLS sem policies em `blue_private` são intencionais: essas tabelas não permitem acesso público; somente o servidor utiliza a role privilegiada.

## Dependências

Next.js e eslint-config-next foram atualizados para 16.3.8. O pacote legado next-pwa foi removido e dependências compatíveis foram atualizadas. A auditoria de produção `npm audit --omit=dev` confirmou zero vulnerabilidades após a atualização. A auditoria completa ainda indica cinco alertas altos no encadeamento braces/micromatch/fast-glob do plugin de ESLint. O npm sugere um downgrade incompatível, que não foi aplicado; esses pacotes são ferramentas de desenvolvimento.

## Limites desta validação

- Não há contas provisionadas no ambiente hospedado: a chave server-side necessária para Supabase Auth Admin não está disponível pelo conector.
- A criação de senha, login e reset via Supabase Auth real precisam ser exercitados depois de configurar o segredo e provisionar as contas.
- O ambiente não conseguiu iniciar agent-browser; a instalação de Chromium para Playwright também falhou. A inspeção visual em navegador e as interações reais não foram verificadas.
- Os testes de concorrência verificam locks/leases/idempotência, mas não constituem um teste de carga entre múltiplas conexões em produção.

## Liberação

1. Configurar `BLUE_SUPABASE_SERVICE_ROLE_KEY` no projeto `controle` da Vercel, em Production e Preview. A URL do novo banco já foi configurada.
2. Desativar cadastro público no Supabase.
3. Executar `npm run provision` com `.env.local` configurado.
4. Usar o convite privado do Mark; criar convites de Andressa e Sidney.
5. Validar login, quitação, autorização e aparência na prévia.
6. Promover para Production, mantendo `controle-blue.vercel.app`.

A produção anterior permanece preservada até essa liberação.
