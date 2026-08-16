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
