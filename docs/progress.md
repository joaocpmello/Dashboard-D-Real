# Progresso do projeto

> Atualizado após cada fase.

## FASE 0 — Análise & Arquitetura

**Status:** ✅ Concluída

**O que foi feito:**
- Diretório de destino verificado (vazio — projeto greenfield);
- Stack confirmada com o usuário: pnpm, Prisma + DATABASE_URL/DIRECT_URL, RLS ativo, credenciais iFood por ambiente;
- Documentação oficial do iFood consultada (auth + merchant endpoints);
- Arquitetura documentada em `docs/architecture.md`;
- Decisões registradas em `docs/decisions/` (3 ADRs);
- Modelagem inicial em `docs/database.md`;
- Integração iFood em `docs/ifood.md`;
- Princípios de segurança em `docs/security.md`.

**Decisões-chave:**
- ADR-0001: multi-tenant com RLS + Prisma (defesa em profundidade);
- ADR-0002: ambientes iFood via credenciais separadas, host único (doc oficial não publica host de sandbox distinto);
- ADR-0003: criptografia AES-256-GCM para `client_secret`/`access_token` em repouso.

**Pendências pra FASE 1:**
- Confirmar host de sandbox do iFood assim que a doc oficial publicar (não-bloqueante — código já está isolado pra trocar);
- Inicializar projeto Next.js.

**Próximos passos:** FASE 1 — Fundação (Database + Auth/RBAC).

---

## FASE 1 — Fundação (Database + Auth/RBAC)

**Status:** ✅ Concluída

**Arquivos criados:**
- `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.ts`, `.eslintrc.json`, `.gitignore`
- `prisma/schema.prisma` — 6 entidades MVP (Organization, User, OrganizationUser, Merchant, IfoodCredential, AuditLog)
- `prisma/migrations/20260815000000_init_with_rls/migration.sql` — tabelas + `pgcrypto` + RLS nas 4 tabelas multi-tenant
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.ts` + script `pnpm db:seed` — promove `INITIAL_SUPER_ADMIN_EMAIL` para `isSuperAdmin = true` (idempotente)
- `src/lib/supabase/{admin,server,browser}.ts` — clientes Supabase segregados (admin/service_role ≠ server/anon ≠ browser/anon)
- `src/middleware.ts` — proteção de rotas + refresh de sessão
- `src/lib/auth/{session,errors,rbac,with-auth}.ts` — `getSessionUser` cacheado por request, `RBACService`, erros semânticos, helper `toErrorResponse`
- `src/lib/db/{prisma,tenant}.ts` — singleton Prisma + `withTenantContext` (SET LOCAL `app.current_org_id`)
- `src/lib/crypto/secrets.ts` — AES-256-GCM
- `src/repositories/{organizations,merchants,audit,ifood-credentials}.ts` — Prisma + tenant context + filtros `organization_id` em toda query
- `src/schemas/index.ts` — Zod para entrada
- `src/app/{layout,page,globals.css,login/page,dashboard/page}` — esqueleto navegável
- `tests/{rbac,multi-tenant-isolation}.test.ts` + `vitest.config.ts`

**Decisões aplicadas:**
- ADR-0001 (RLS ativo) — políticas por `current_setting('app.current_org_id')` via `SET LOCAL`;
- ADR-0002 (uma URL, duas credenciais) — coluna `environment` em `ifood_credentials`;
- ADR-0003 (AES-256-GCM) — colunas `client_secret_cipher` e `access_token_cipher` (chave em `CREDENTIAL_ENCRYPTION_KEY`).

**Como rodar localmente (após preencher `.env`):**
```bash
pnpm install
pnpm db:migrate        # aplica a migration com RLS
pnpm db:seed           # promove INITIAL_SUPER_ADMIN_EMAIL
pnpm dev
```

---

## FASE 2 — Integração iFood + APIs internas + Testes

**Status:** ✅ Concluída

**Arquivos criados / editados nesta fase:**

- `src/lib/ifood/client.ts` — `IfoodClient` com timeout, retry em 5xx, 429 com `Retry-After`, mapeamento 401 → `IfoodAuthError`, logs sem tokens
- `src/lib/ifood/auth.ts` — `IfoodAuthService` com cache em memória por `(org, env)`, margem de segurança 5min, persistência criptografada, `invalidate()` e `clearAllCacheForTests()`
- `src/lib/ifood/merchant.ts` — `IfoodMerchantService` (listAndSync com upsert idempotente + audit log + status best-effort), `resolveEnvironment`
- `src/lib/ifood/errors.ts` — `IfoodError`, `IfoodAuthError`, `IfoodRateLimitError`
- `src/lib/ifood/types/{token,merchant}.ts` — tipos baseados na doc oficial
- `src/app/api/merchants/route.ts` — `GET` (lista, VIEWER+) / `POST` (upsert de credenciais iFood, ADMIN+)
- `src/app/api/merchants/sync/route.ts` — sincroniza merchants com o iFood (ADMIN+)
- `src/app/api/organizations/route.ts` — `GET`/`POST`/`PUT` (apenas SUPER_ADMIN; `PUT` convida membro via Supabase Auth)
- `tests/crypto-secrets.test.ts` (4 testes) — roundtrip AES, IVs únicos, versões, validação de chave
- `tests/ifood-auth.test.ts` (5 testes) — cache, expiração, segregação, invalidação, erros
- `tests/ifood-client.test.ts` (6 testes) — Bearer header, 401, 429, 5xx, timeout, 4xx
- `tests/ifood-merchant.test.ts` (2 testes) — sync + audit + best-effort status
- `tests/with-auth.test.ts` (4 testes) — mapeamento de erros
- `tests/shims/server-only.ts` — stub do módulo virtual do Next
- `vitest.config.ts` — alias `server-only` para testes
- `next.config.mjs` — substitui `next.config.ts` (suporte oficial de `.ts` só no Next 15); adiciona `Strict-Transport-Security`

**Auditoria de segurança (FASE 4 — sweep):**
- ✅ Nenhum `NEXT_PUBLIC_*` indevido (só `SUPABASE_URL`/`ANON_KEY`, ambos públicos por design)
- ✅ Nenhum `console.log` com token/secret
- ✅ Frontend (`src/app/**/page.tsx`) nunca chama `merchant-api.ifood.com.br` diretamente
- ✅ `clientSecret` chega via POST, é criptografado, e nunca é exposto em responses (`publicView` esconde)
- ✅ Toda query multi-tenant passa por `withTenantContext` (RLS) **e** filtro `where: { organizationId }`
- ✅ Helpers de erro (`toErrorResponse`) nunca expõem stack/details

**Validações executadas:**
```
npm run typecheck   → 0 erros
npm test            → 29/29 testes passando (7 arquivos)
npx eslint src tests → 0 erros, 0 warnings
npm run build       → ✓ Compiled successfully (9 rotas)
```

**Decisões aplicadas:**
- ADR-0002: `IfoodClient` lê `IFOOD_BASE_URL` de constante única — se doc oficial publicar host distinto, troca-se em UM lugar;
- Helper de teste `IfoodAuthService.clearAllCacheForTests()` — necessário por o cache ser estático entre cenários; em produção esse método é inerte.

**Próximos passos:** FASE 3 — Frontend (login, layout autenticado, sidebar, dashboard com dados reais, tela de lojas, usuários, configurações).

---

## FASE 2.5 — Supabase / Integração Real

**Status:** ✅ Concluída (validação estática e unitária). Teste E2E real contra Supabase pendente de credenciais no ambiente.

**O que foi feito nesta fase:**

- **Clientes Supabase revisados** em `src/lib/supabase/`:
  - `server.ts` — `createSupabaseServerClient` para Server Components / Route Handlers / Server Actions, usa `NEXT_PUBLIC_*` + cookies. Marcar com `import 'server-only'` para falhar cedo se importado por client.
  - `browser.ts` — `createSupabaseBrowserClient` para Client Components, usa apenas `NEXT_PUBLIC_*` (anon), nunca `service_role`.
  - `admin.ts` — `createSupabaseAdminClient` para fluxos privilegiados (seed, convite de membros), usa `SUPABASE_SERVICE_ROLE_KEY` e tem `persistSession: false`. Marcar com `import 'server-only'`.
- **Validação central de env** em `src/lib/env.ts`:
  - `getServerEnv()` valida as 6 chaves server-side em runtime: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CREDENTIAL_ENCRYPTION_KEY`.
  - Falha com mensagem útil listando exatamente as variáveis ausentes.
  - Memoizado para evitar re-leitura repetida.
  - `__resetServerEnvForTests()` para isolar cenários de teste.
- **Criptografia desacoplada** em `src/lib/crypto/secrets.ts`:
  - `loadKey()` valida APENAS `CREDENTIAL_ENCRYPTION_KEY` (32 bytes base64). Não exige `getServerEnv()` para permitir testes unitários da camada de crypto sem o ambiente completo.
- **Dashboard dinâmico** em `src/app/dashboard/page.tsx`:
  - `export const dynamic = 'force-dynamic'` — necessário porque a página depende de sessão Supabase (não pode ser pré-renderizada em build).
- **Middleware Edge** em `src/middleware.ts`:
  - Usa `NEXT_PUBLIC_*` (URL + anon) para refresh de sessão; redireciona rotas privadas para `/login`. Defende-se graciosamente se env estiver ausente no Edge Runtime.
- **Testes:** `tests/env.test.ts` (4 testes novos) cobrindo:
  1. sucesso quando todas as chaves estão presentes;
  2. erro listando chaves ausentes;
  3. cache do resultado (não relê);
  4. reset do cache para reavaliação.
- Total: **33/33 testes** passando em 8 arquivos.

**Auditoria de segurança (sweep final):**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` consumida apenas em `src/lib/env.ts` e `src/lib/supabase/admin.ts` (server-only, com `import 'server-only'`).
- ✅ `createSupabaseAdminClient` chamada apenas em `src/app/api/organizations/route.ts` (Route Handler) — nunca em Client Component.
- ✅ `CREDENTIAL_ENCRYPTION_KEY` consumida apenas em `src/lib/env.ts` e `src/lib/crypto/secrets.ts` (server-only).
- ✅ `IFOOD_*_CLIENT_SECRET` consumido apenas server-side (em `IfoodAuthService`).
- ✅ `access_token` iFood **nunca** aparece em código de produção — persiste criptografado em `ifood_credentials.access_token_cipher`.
- ✅ Nenhum `NEXT_PUBLIC_*` carrega secret real — apenas `SUPABASE_URL` e `ANON_KEY`, ambos públicos por design do Supabase.
- ✅ `clientSecret` chega via POST, é criptografado, e nunca é exposto em responses (`publicView` esconde no repositório de credenciais).
- ✅ Toda query multi-tenant passa por `withTenantContext` (RLS) **e** filtro `where: { organizationId }`.

**Auditoria de .env / versionamento:**
- ✅ `.gitignore` cobre `.env`, `.env.local`, `.env.*.local`.
- ✅ Apenas `.env.example` está versionado — sem valores reais, sem secrets.
- ✅ `.env.local` **não existe** no repositório nem no ambiente desta sessão.
- ✅ `.env.example` documenta como preencher (URL do projeto, anon key, service role, DATABASE_URL/DIRECT_URL, credenciais iFood por ambiente).
- ✅ `SUPABASE_SERVICE_ROLE_KEY`, `IFOOD_*_CLIENT_SECRET`, `CREDENTIAL_ENCRYPTION_KEY` **nunca** são `NEXT_PUBLIC_*`.

**Validações executadas (verdes):**
```
npm test            → 33/33 testes (8 arquivos)
npm run typecheck   → 0 erros
npm run lint        → 0 erros, 0 warnings
npm run build       → ✓ Compiled successfully (9/9 static pages, 3 rotas /api/* dinâmicas)
```

**Status da integração Supabase (declarativo, sem teste E2E real nesta sessão):**
- O projeto Supabase é o destino de deploy (conforme `docs/decisions/ADR-0001-multi-tenant-rls.md`); o código está pronto para conectar via `getServerEnv()`.
- O banco real **não foi provisionado nesta sessão** — não há `.env.local` com `DATABASE_URL` apontando para Supabase, e a migration `20260815000000_init_with_rls` **não foi aplicada** contra um Postgres real.
- O `prisma/seed.ts` (que promove `INITIAL_SUPER_ADMIN_EMAIL`) **não foi executado** por falta de credenciais.
- O teste E2E de auth → sessão → Organization → Merchant **não foi executado** por falta de projeto Supabase provisionado.

**Validações E2E pendentes (dependem de ação manual do usuário):**
1. Provisionar projeto Supabase (ou usar Supabase local via `supabase start`).
2. Preencher `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CREDENTIAL_ENCRYPTION_KEY` (gerar nova chave AES) e `INITIAL_SUPER_ADMIN_EMAIL`.
3. Rodar `pnpm db:migrate` (aplica schema + RLS).
4. Criar o primeiro usuário no Supabase Auth (Authentication → Users → Add user) com o email de `INITIAL_SUPER_ADMIN_EMAIL`.
5. Rodar `pnpm db:seed` (promove a `isSuperAdmin = true`).
6. Subir a aplicação (`pnpm dev`) e validar:
   - login com o super-admin;
   - `GET /api/organizations` (deve retornar lista vazia);
   - criar Organization via `POST /api/organizations`;
   - convidar membro via `PUT /api/organizations`;
   - criar credencial iFood via `POST /api/merchants`;
   - sincronizar via `POST /api/merchants/sync`.

**Validação de RLS contra Postgres real (pendente):**
- A migration define as policies via `current_setting('app.current_org_id')` + `set_config(...)` em transação (`withTenantContext` em `src/lib/db/tenant.ts`).
- O teste unitário `tests/multi-tenant-isolation.test.ts` valida o helper via mock; a versão `.skip` (integração real) requer Postgres com RLS ativo.
- Para validar E2E: criar 2 Organizations (A e B) com 1 usuário cada e 1 merchant cada, e confirmar via SQL/psql que `SET LOCAL app.current_org_id = '<A-uuid>'` faz a query só retornar os merchants de A.
- A política `audit_logs` permite `app.current_org_id IS NULL` para SUPER_ADMIN (acesso cross-tenant intencional).
- RLS não está testado automaticamente aqui — depende da execução real do item 3 acima.

**Limitação / observação de ambiente:**
- Em uma execução anterior, o build chegou a falhar intermitentemente com erro de `readlink` / `font-manifest.json` no Windows + OneDrive (conhecido problema de sincronização de filesystem). Foi resolvido com `rm -rf .next && npm run build` — sem qualquer alteração de código. Não é um defeito do projeto.
- O `crypto-secrets.ts` foi ajustado nesta fase para que `loadKey()` valide apenas `CREDENTIAL_ENCRYPTION_KEY`, desacoplando a camada de crypto da validação completa de env (necessário para os testes unitários de criptografia). Essa decisão está consolidada e não deve ser revertida sem motivo.

**Próximos passos:** FASE 3 — Frontend (login, layout autenticado, sidebar, dashboard, lojas, usuários, configurações). Não começar pedidos ainda.

---

## FASE 3 — Frontend / MVP Visual Demonstrável

**Status:** ✅ Concluída (visual). Backend real ainda depende de Supabase provisionado.

**Telas entregues (rotas autenticadas):**

- `/login` — split-screen SaaS: branding à esquerda (checkpoints de venda), formulário à direita com "Entrar com credenciais de demo", tratamento de erros traduzidos do Supabase.
- `/dashboard` — hero de boas-vindas, 4 StatCards (lojas / abertas / pedidos hoje / faturamento hoje), tabela de lojas resumida, card de Integração iFood, card "Em breve" para performance operacional.
- `/lojas` — 4 StatCards (total / abertas / pausadas / com problema), filtros pill por status com contagens + busca textual + tabela completa + EmptyState contextual.
- `/lojas/[id]` — header da loja com status badge, resumo operacional, integração iFood lateral, e seções "Pedidos" / "Cardápio" marcadas como "Em breve".
- `/usuarios` — 4 StatCards (total / ativos / admins / gerentes), tabela com avatar/iniciais, RoleBadge, status ativo/inativo, distribuição por papel com barras de progresso, painel descritivo de permissões por papel.
- `/configuracoes` — dados da organização (read-only), credenciais iFood separadas por ambiente (sandbox/produção), preferências (em breve), Integração iFood, sessão atual, lista de princípios de segurança ativos.

**Layout & shell:**

- `AppShell` — sidebar desktop (≥md) + drawer mobile (<md) controlado por `MobileShellController` (client component).
- `Sidebar` — `isActive()` considera subrotas (`/lojas/[id]` ativa "Lojas"). Itens "Em breve" ficam desabilitados com dot warning.
- `Header` — sticky, com org name, badge de modo demo, slot para ações da página.
- `UserMenu` — avatar com iniciais, papel traduzido, link para Configurações, Sair.

**Sistema visual:**

- Cores: `brand` (laranja MarmitaOS), `ink` (slate), `success`, `warn`, `danger`, `info`.
- Componentes: `Card`, `Badge` (+ `Dot`), `Button` (primary/secondary/ghost/danger × sm/md/lg), `Input`, `Select`, `Label`, `Table` (`Table`, `THead`, `TBody`, `TR`, `TH`, `TD`, `TableEmpty`).
- Estados: `LoadingState`, `EmptyState`, `ErrorState` em `src/components/ui/States.tsx`.
- `MerchantStatus` — normaliza status iFood (OPEN/CLOSED/PAUSED/INTEGRATION_PROBLEM/UNKNOWN) com tom visual.
- `RoleBadge` — mapa de papéis ADMIN/MANAGER/OPERATOR/VIEWER → badge.

**Mocks isolados:**

- `src/mocks/demo-data.ts` — `DEMO_ORG`, `DEMO_MERCHANTS` (6 lojas com status variado), `DEMO_USERS` (5 usuários cobrindo todos os papéis, um inativo).
- `src/lib/data/index.ts` — `dataMode.isDemo()` decide mocks vs. Prisma. Cai em demo se faltar env do Supabase ou se `NEXT_PUBLIC_DEMO_MODE=true`.
- `getPageContext()` — combina sessão Supabase com fallback de demo (usuário Carla Mendes, ADMIN) para a apresentação.

**Responsividade:**

- Sidebar desktop oculta em <md; drawer mobile com backdrop, lock de scroll, fecha ao navegar.
- Hamburger no Header em <md.
- Tabelas com `overflow-x-auto`.
- Grid de StatCards colapsa de 4 → 2 colunas em telas pequenas.

**Validações executadas (verdes):**
```
npm test            → 33/33 testes (8 arquivos)
npm run typecheck   → 0 erros
npm run lint        → 0 erros, 0 warnings
npm run build       → ✓ Compiled successfully (12 rotas)
```

**Auditoria de segurança (re-sweep FASE 3):**

- ✅ Nenhuma rota nova chama `merchant-api.ifood.com.br` — tudo passa pelo servidor.
- ✅ Nenhum `NEXT_PUBLIC_*` novo carrega secret.
- ✅ `/lojas/[id]` valida `notFound()` se o merchant não pertence à org do usuário (via `getMerchant` no `lib/data`).
- ✅ `Sidebar` filtra "Usuários" para quem não tem MANAGER+; `/usuarios` checa `canManage` para exibir CTA de convite.
- ✅ `/configuracoes` marca "Atualizar credenciais" como desabilitado sem permissão ADMIN+.

**Pendências declaradas (não bloqueiam a apresentação):**

- Forms em `/configuracoes` estão read-only — edição real fica para depois que Supabase estiver provisionado e a API de org/credentials estiver completa.
- `Sincronizar agora` em `/lojas` é botão desabilitado (UI pronta; sync real já existe via `POST /api/merchants/sync`).
- `Convidar usuário` é botão desabilitado (a API já existe: `PUT /api/organizations`).
- Módulo de pedidos, cardápio, avaliações, promoções, relatórios e billing continuam como "Em breve" — não implementados nesta fase.

**Próxima fase:** FASE 4 — Segurança (CSP, rate limiting, auditoria contínua). Antes disso, priorizar provisionamento do Supabase real para validar E2E.
