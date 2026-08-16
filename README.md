# SaaS Marmitarias iFood — Consultoria

Plataforma **multi-tenant** para uma empresa de consultoria que gerencia operações de marmitarias integradas ao iFood. O SaaS permite administrar várias Organizações (clientes da consultoria), cada uma com suas Lojas (Merchants), Usuários e papéis (RBAC), além de integração centralizada com a **API oficial do iFood** via **OAuth 2.0**.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript |
| UI | Tailwind CSS |
| Backend | Next.js Route Handlers + Server Actions (Node.js + TS) |
| Banco | PostgreSQL (Supabase) |
| ORM | Prisma (DATABASE_URL pooled + DIRECT_URL direct) |
| Auth | Supabase Auth + sessões server-side |
| RBAC | Próprio, enforced no servidor |
| Validação | Zod |
| Testes | Vitest |
| Integração iFood | REST oficial + OAuth 2.0 (`client_credentials`) |
| Deploy | Vercel |

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (ou npm/yarn)
- Conta no [Supabase](https://supabase.com) (projeto + Auth ativado)
- Conta no portal developer do [iFood](https://developer.ifood.com.br) (app + credenciais de sandbox)

## Instalação

```bash
pnpm install
cp .env.example .env   # preencher todas as variáveis
pnpm db:migrate        # aplica a migration com RLS
pnpm db:seed           # promove INITIAL_SUPER_ADMIN_EMAIL para super_admin
pnpm dev               # http://localhost:3000
```

## Variáveis de ambiente

Veja `.env.example`. Princípios:

- **Nunca** prefixar secrets com `NEXT_PUBLIC_*`.
- Conexão com banco em pool + direct separadas.
- Credenciais iFood **separadas por ambiente** (sandbox e production).
- `CREDENTIAL_ENCRYPTION_KEY` — chave AES-256-GCM (32 bytes base64). Gerar com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

## Arquitetura

Documentação detalhada em `docs/`:

- [`docs/architecture.md`](docs/architecture.md) — visão geral, camadas, segurança, fluxo iFood
- [`docs/database.md`](docs/database.md) — modelagem, RLS, índices
- [`docs/ifood.md`](docs/ifood.md) — OAuth, endpoints, camadas `src/lib/ifood/`
- [`docs/security.md`](docs/security.md) — princípios e auditoria
- [`docs/progress.md`](docs/progress.md) — status por fase

```
SaaS
├── Organization A
│   ├── Users (via organization_users)
│   ├── Merchants (lojas)
│   └── IfoodCredentials (por ambiente)
├── Organization B
└── Organization C
```

**Isolamento multi-tenant** aplicado em **4 camadas**:
1. Autorização no servidor (RBAC + ownership)
2. Filtros `organization_id` em todas as queries
3. RLS do Postgres (políticas por `current_setting('app.current_org_id')`)
4. Testes automatizados que falham se o isolamento vazar

## RBAC

| Papel | Escopo |
|---|---|
| `SUPER_ADMIN` | SaaS inteiro. Gerencia qualquer Organization. |
| `ADMIN` | Organization. Gerencia usuários e merchants. |
| `MANAGER` | Operação das lojas. |
| `OPERATOR` | Operações permitidas. Não gerencia usuários. |
| `VIEWER` | Somente leitura. |

RBAC é enforced **exclusivamente no servidor**.

## API interna

- `GET /api/merchants` — lista merchants (VIEWER+)
- `POST /api/merchants` — upsert de credenciais iFood (ADMIN+)
- `POST /api/merchants/sync` — sincroniza merchants com iFood (ADMIN+)
- `GET /api/organizations` — lista organizações (SUPER_ADMIN)
- `POST /api/organizations` — cria organização (SUPER_ADMIN)
- `PUT /api/organizations` — convida membro para organização (SUPER_ADMIN)

Todas as APIs: autenticam → autorizam (RBAC) → validam (Zod) → executam regra → retornam resposta segura.

## Testes

```bash
pnpm test            # 29 testes em 7 arquivos
pnpm run typecheck   # tsc --noEmit
pnpm run lint        # eslint (via npx eslint)
pnpm run build       # next build
```

Cobertura:
- RBAC (5) — hierarquia, SUPER_ADMIN bypass, sem sessão, sem org
- Multi-tenant isolation (3) — `withTenantContext`, RLS, filtros `organization_id`
- IfoodAuthService (5) — cache, expiração, segregação, invalidação, erros
- IfoodClient (6) — Bearer header, 401, 429 retry, 5xx retry, timeout, 4xx
- IfoodMerchantService (2) — sync + audit + best-effort status
- Crypto AES-256-GCM (4) — roundtrip, IVs únicos, versões, validação de chave
- toErrorResponse (4) — Unauthorized, Forbidden, Zod, genérico

## Fluxo de integração iFood

```
[Navegador] ─HTTPS/cookies─▶ [Next.js Server / Route Handlers]
                                   │ valida sessão + RBAC + tenant
                                   ▼
                            [IfoodClient] ──▶ [IfoodAuthService]
                                                    │ cache (memória, server-only)
                                                    ▼
                            POST /authentication/v1.0/oauth/token
                                                    │
                                                    ▼
                            [iFood Merchant API — merchant-api.ifood.com.br]
```

- Frontend **nunca** fala com iFood diretamente.
- `client_secret` e tokens são criptografados em repouso (AES-256-GCM).
- Token cacheado em memória por `(org, environment)` com margem de 5min de segurança.
- Refresh automático em 401 (1 retry) e backoff exponencial em 429/5xx.

## Segurança

- RLS ativo em `merchants`, `ifood_credentials`, `organization_users`, `audit_logs`
- `SUPABASE_SERVICE_ROLE_KEY` e `CREDENTIAL_ENCRYPTION_KEY` server-only (nunca `NEXT_PUBLIC_*`)
- Resposta de erro nunca inclui stack, mensagens internas ou detalhes do iFood
- Headers HTTP: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- Audit log de ações sensíveis (criação, alteração, role, sync iFood, credentials)

## Roadmap

- [x] FASE 0 — Análise & Arquitetura
- [x] FASE 1 — Fundação (Database + Auth/RBAC)
- [x] FASE 2 — Integração iFood + APIs internas + Testes
- [ ] FASE 3 — Frontend (login, layout, sidebar, dashboard, lojas, usuários)
- [ ] FASE 4 — Segurança (auditoria contínua, CSP, rate limiting)
- [ ] FASE 5 — QA
- [ ] FASE 6 — Documentação
- [ ] FASE 7 — Revisão final

**Próxima grande fase após MVP:** PEDIDOS (orders, eventos, status, histórico, itens, pagamentos, cancelamentos).
