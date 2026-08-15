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
- `src/lib/crypto/` *(FASE 2 — placeholder)*
- `src/repositories/{organizations,merchants,audit}.ts` — Prisma + tenant context + filtros `organization_id` em toda query
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

**Próximos passos:** FASE 2 — Integração iFood (OAuth, IfoodClient, IfoodAuthService, IfoodMerchantService, APIs internas, audit).
