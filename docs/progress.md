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

---

## DEPLOY / PRODUÇÃO

**Status:** 🟡 Configurado para deploy na Vercel. Aguardando provisionamento manual do Supabase e configuração de credenciais de produção.

### Plataforma

| Item | Valor |
|---|---|
| Plataforma | **Vercel** (Hobby ou Pro) |
| Framework | **Next.js 14.2** (App Router) |
| Runtime Node | 20.x |
| Banco | **Supabase PostgreSQL** (RLS ativo) |
| ORM | Prisma 5.22 (`DATABASE_URL` pooled + `DIRECT_URL` direct) |
| Auth | Supabase Auth (cookies HTTP-only via `@supabase/ssr`) |
| Região | Definida na Vercel (recomendado: mesma do Supabase) |

### Compatibilidade Vercel (validação estática)

- ✅ **Route Handlers** (`/api/merchants`, `/api/merchants/sync`, `/api/organizations`) — Serverless Functions, Edge-compatíveis.
- ✅ **Middleware** (`src/middleware.ts`) — Edge Runtime (usa `NEXT_PUBLIC_*` apenas; defensivo se env faltar).
- ✅ **Server-only** (`import 'server-only'`) — quebra o build se algum import vazar para o client.
- ✅ **Prisma** — singleton em `src/lib/db/prisma.ts`; `prisma generate` executado em `postinstall`.
- ✅ **Supabase** — segregado em 3 clientes (`browser` anon, `server` anon, `admin` service_role). Nenhum secret no client.
- ✅ **Auth** — sessão via cookies gerenciados por `@supabase/ssr`.
- ✅ **Headers de segurança** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` configurados em `next.config.mjs`.

### Variáveis de ambiente (Vercel → Project Settings → Environment Variables)

**Públicas (NEXT_PUBLIC_*) — embutidas no bundle do cliente, seguras por design:**

| Variável | Exemplo | Ambiente |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://marmitarias-ifood.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon public key) | Production, Preview, Development |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Production (não usar `true` em prod) |

**Server-only — NUNCA `NEXT_PUBLIC_*`:**

| Variável | Origem | Ambiente |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Production, Preview, Development |
| `DATABASE_URL` | Supabase → Settings → Database (porta 6543, pooled) | Production, Preview, Development |
| `DIRECT_URL` | Supabase → Settings → Database (porta 5432, direct) | Production, Preview, Development |
| `CREDENTIAL_ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | Production (e Preview se quiser testar) |
| `INITIAL_SUPER_ADMIN_EMAIL` | Email do seu super-admin | Production, Preview, Development |
| `IFOOD_ENVIRONMENT` | `sandbox` ou `production` | Production, Preview, Development |
| `IFOOD_SANDBOX_CLIENT_ID` | iFood developer portal | Development, Preview |
| `IFOOD_SANDBOX_CLIENT_SECRET` | iFood developer portal | Development, Preview |
| `IFOOD_PRODUCTION_CLIENT_ID` | iFood developer portal | Production (quando promovido) |
| `IFOOD_PRODUCTION_CLIENT_SECRET` | iFood developer portal | Production (quando promovido) |

⚠️ **ATENÇÃO:**
- A `SUPABASE_SERVICE_ROLE_KEY` tem poder de admin total. Vazou = banco comprometido.
- A `CREDENTIAL_ENCRYPTION_KEY` é usada para criptografar segredos do iFood em repouso. Se você trocá-la em produção, os dados existentes no banco ficarão ilegíveis. Mantenha a mesma do `.env` original.
- Se você ainda não tem credenciais do iFood, deixe as variáveis vazias. A aplicação não quebra — o `/configuracoes` e a sync de merchants só funcionam quando há credenciais válidas.

### Configuração do Supabase Auth (após primeiro deploy)

No painel do Supabase, em **Authentication → URL Configuration**:

- **Site URL:** `https://SEU-PROJETO.vercel.app` (ou domínio custom)
- **Redirect URLs:** adicione:
  - `https://SEU-PROJETO.vercel.app/auth/callback`
  - `https://SEU-PROJETO.vercel.app/login`
  - `https://meudominio.com/auth/callback` (quando configurar domínio)

### Migrations Prisma

A Vercel **não executa migrations automaticamente** durante o build. Aplicar manualmente antes do primeiro deploy real:

```bash
# Em ambiente local com DATABASE_URL/DIRECT_URL apontando para o Supabase de produção:
npx prisma migrate deploy
```

Ou via Vercel CLI:
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

Nenhuma migration destrutiva deve ser executada automaticamente. A migration `20260815000000_init_with_rls` é a única existente e é **non-destructive** (cria tabelas + RLS).

### Domínio customizado

1. Vercel → Project → Settings → Domains → Add
2. Inserir `meudominio.com` (ou subdomínio `app.meudominio.com`)
3. Vercel mostra os registros DNS a configurar no provedor do domínio
4. Após propagação, atualizar `NEXT_PUBLIC_APP_URL` para `https://meudominio.com`
5. Atualizar **Site URL** e **Redirect URLs** no Supabase

### Processo de deploy (passo a passo)

**Opção 1 — Via Vercel Dashboard (recomendado para primeira vez):**
1. Acesse https://vercel.com e faça login
2. **Add New → Project** → Importar o repositório Git (`marmitarias-ifood-saas` ou nome do seu repo)
3. **Framework Preset:** Next.js (detectado automaticamente)
4. **Build Command:** `npm run build` (padrão Vercel)
5. **Install Command:** `npm install` (padrão Vercel) — o `postinstall: prisma generate` roda automaticamente
6. **Output Directory:** deixe em branco (Next.js padrão)
7. **Environment Variables:** adicionar todas as da tabela acima
8. Clicar em **Deploy**
9. Aguardar build (~2-4 min)
10. Abrir `https://SEU-PROJETO.vercel.app`

**Opção 2 — Via Vercel CLI:**
```bash
cd "C:/Users/joaoc/OneDrive/Desktop/Dashboard delivery"
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... (repetir para cada variável)
vercel --prod
```

### Limitações e bloqueios conhecidos

- **Migrations não rodam no build da Vercel.** A primeira vez em produção, rodar `prisma migrate deploy` manualmente (local ou CI).
- **Sem Supabase provisionado, o app cai em modo demo.** Isso é intencional (`src/lib/data/index.ts`) — o front exibe dados mock até você conectar um Supabase real.
- **Cookies Supabase exigem HTTPS.** A Vercel serve HTTPS por padrão em `*.vercel.app` e domínios custom.
- **Service role key nunca chega ao browser** (verificado por `import 'server-only'` em `src/lib/supabase/admin.ts`).

### Resultado esperado

Ao final do deploy:
- `https://SEU-PROJETO.vercel.app` → página de login
- Login com `INITIAL_SUPER_ADMIN_EMAIL` → dashboard
- Dashboard, lojas, usuários, configurações funcionais (dados reais se Supabase conectado, demo caso contrário)

---

## CONTINUIDADE DA PRÓXIMA SESSÃO

**Fase atual:** FASE 4 — Validação E2E real com Supabase provisionado + Deploy.
**Última etapa concluída:** Seed do SUPER_ADMIN executado com sucesso contra o Supabase real.
**Última ação executada:** Verificação pós-seed (`scripts/verify-seed.js`) confirmando o espelho `auth.users ↔ public.users` e validações finais (test/typecheck/lint/build) todas verdes.

### Resultado do seed (2026-08-18)

- `prisma/seed.ts` rodou sem erro usando `TSX_TSCONFIG_PATH=tsconfig.seed.json` (alias `server-only` → `tests/shims/server-only.ts`).
- `public.users`: linha de `joao@deliveryreal.com` (id `0ccaed43-5ad1-4662-bcdb-76cfdc3384c1`) com `isSuperAdmin = true`.
- `auth.users` (Supabase): mesmo UUID, email confirmado — espelhamento OK.
- `Organization`: 0 (esperado — seed não cria Organization; é criada via UI pelo super-admin após login).
- `OrganizationUser` para o super-admin: 0 (esperado — ele é global, não precisa de membership).
- `Merchant`: 0.

### Validações finais (todas verdes)

```
npm test            → 33/33 testes (8 arquivos)
npm run typecheck   → 0 erros
npm run lint        → 0 erros, 0 warnings
npm run build       → ✓ Compiled successfully (12/12 páginas)
```

### Arquivos modificados nesta sessão

- `scripts/verify-seed.js` *(novo)* — verificação ad-hoc do espelho Auth ↔ DB via `DIRECT_URL` (pgBouncer pooled não aceita prepared statements para scripts de múltiplas queries).
- `tsconfig.seed.json` *(já existente, confirmado)* — alias de `server-only` para `tests/shims/server-only.ts`; módulo de produção continua importando `server-only` real.
- `scripts/run-seed.js` *(já existente, confirmado)* — loader manual de `.env.local` + executor via `tsx`.
- `docs/progress.md` *(este arquivo)* — seção de continuidade adicionada.

### Próxima ação exata

1. **Validação manual E2E** (depende do usuário, não automatizável nesta sessão):
   - `pnpm dev` (ou `npm run dev`) e abrir `http://localhost:3000/login`.
   - Logar com `INITIAL_SUPER_ADMIN_EMAIL` e a senha cadastrada no painel Supabase Auth.
   - Confirmar redirecionamento para `/dashboard`.
   - Criar uma Organization via UI (POST `/api/organizations` deve estar exposto apenas para super-admin).
   - (Opcional) Convidar um membro via PUT `/api/organizations` para validar o fluxo admin.
2. **Decidir o próximo marco** entre:
   - **Deploy para Vercel** (variáveis já documentadas na seção "Deploy/Produção" deste arquivo) — seguir o passo a passo `Opção 1` (Dashboard) ou `Opção 2` (CLI).
   - **FASE 4 — Segurança** (CSP, rate limiting, auditoria contínua) antes do deploy público.
   - **FASE 5 — Pedidos / Cardápio / Relatórios** (escopo de produto, não-bloqueante para o deploy).

### Comando para continuar

```bash
# Para subir o app e validar login manualmente:
cd "C:/Users/joaoc/OneDrive/Desktop/Dashboard delivery"
npm run dev

# Para re-executar o seed (idempotente):
TSX_TSCONFIG_PATH=tsconfig.seed.json node scripts/run-seed.js .env.local tsx prisma/seed.ts

# Para re-verificar o estado do DB:
node scripts/verify-seed.js
```

### Pendências

- ✅ Seed executado.
- ✅ Espelho Auth ↔ DB validado.
- ✅ Testes/typecheck/lint/build verdes.
- � Validação manual do fluxo de login (depende do usuário no browser).
- � Criação da primeira Organization (via UI).
- ⏳ Deploy na Vercel (variáveis documentadas; basta aplicar).
- ⏳ FASE 4 (segurança adicional) e FASE 5 (escopo de produto) — não bloqueantes.

### Testes executados nesta sessão

- `npm test` — 33/33 verdes (env, crypto-secrets, ifood-auth, ifood-client, ifood-merchant, multi-tenant-isolation, rbac, with-auth).
- `npm run typecheck` — 0 erros.
- `npm run lint` — 0 erros, 0 warnings.
- `npm run build` — 12/12 páginas, todas as rotas (`/`, `/login`, `/dashboard`, `/lojas`, `/lojas/[id]`, `/usuarios`, `/configuracoes`, `/api/merchants`, `/api/merchants/sync`, `/api/organizations`, `/_not-found`, middleware).

### Problemas conhecidos

- **pgBouncer pooler (`DATABASE_URL` porta 6543) não suporta prepared statements em scripts ad-hoc de múltiplas queries** — erro `prepared statement "s0" already exists`. Solução já aplicada: scripts de verificação (`verify-seed.js`) usam `DIRECT_URL` (porta 5432, conexão direta). O app em runtime usa `DATABASE_URL` (pooler) normalmente porque o `withTenantContext` faz `SET LOCAL` por transação, evitando esse padrão.
- **OneDrive + Windows + `next build`** pode falhar intermitentemente com erro de `readlink` / `font-manifest.json` (problema de sincronização de filesystem, não do projeto). Resolução: `rm -rf .next && npm run build`. Não foi necessário nesta sessão.

### Notas de segurança (não colocar no versionamento)

- `SUPABASE_SERVICE_ROLE_KEY`, `CREDENTIAL_ENCRYPTION_KEY`, `IFOOD_*_CLIENT_SECRET` continuam apenas server-side e fora de `NEXT_PUBLIC_*`. Já validado no sweep anterior.
- Nenhum secret é exposto por este documento ou pelos logs desta sessão.

