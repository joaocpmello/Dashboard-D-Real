# Banco de Dados — Modelagem MVP

> Última atualização: FASE 0. Detalhes de implementação em `prisma/schema.prisma` (criado na FASE 1).

## Convenções

- **Tabela** snake_case, **plural** (`organization_users`, `audit_logs`);
- **PK** UUID (`uuid_generate_v4()`) — não sequencial, evita enumeração;
- Timestamps `created_at`/`updated_at` em tudo;
- `organization_id` em **toda tabela de negócio** (FK → `organizations.id`);
- **Índices** em toda FK + em colunas usadas em filtros de listagem (`organization_id`, `ifood_merchant_id`);
- **Soft delete**: `deleted_at` apenas quando houver requisito legal/operacional — MVP não usa.

## Entidades MVP

### `organizations`
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `document` | text UNIQUE | CNPJ/CPF, índice único |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | |

### `users`
Mirror server-side de `auth.users` (Supabase).
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text UNIQUE NOT NULL | espelho |
| `full_name` | text | |
| `is_super_admin` | boolean NOT NULL DEFAULT false | bypassa RLS via role Postgres |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `organization_users`
Associação N:N entre User e Organization + role.
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK NOT NULL | |
| `user_id` | uuid FK NOT NULL | |
| `role` | enum NOT NULL | `ADMIN`/`MANAGER`/`OPERATOR`/`VIEWER` |
| `created_at` | timestamptz | |
| UNIQUE | (`organization_id`, `user_id`) | |

### `merchants`
Lojas vinculadas à Organization.
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK NOT NULL | |
| `ifood_merchant_id` | text NOT NULL | id do merchant no iFood |
| `name` | text | |
| `corporate_name` | text | |
| `status` | text | `OK`/`WARNING`/`CLOSED`/`ERROR` |
| `last_synced_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| UNIQUE | (`organization_id`, `ifood_merchant_id`) | |

### `ifood_credentials`
Credenciais por Organization e por ambiente.
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK NOT NULL | |
| `environment` | enum NOT NULL | `sandbox`/`production` |
| `client_id` | text NOT NULL | |
| `client_secret_cipher` | text NOT NULL | AES-256-GCM (ADR-0003) |
| `client_secret_key_version` | int NOT NULL | rotação |
| `access_token_cipher` | text | cache |
| `access_token_expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| UNIQUE | (`organization_id`, `environment`) | |

### `audit_logs`
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK | nullable pra ações globais do SUPER_ADMIN |
| `user_id` | uuid FK | |
| `action` | text NOT NULL | ex.: `organization.create` |
| `entity` | text | ex.: `Merchant` |
| `entity_id` | uuid | |
| `metadata` | jsonb | sem secrets |
| `created_at` | timestamptz NOT NULL DEFAULT now() | índice |

## RLS (resumo — SQL em `prisma/migrations/.../rls.sql`)

Para cada tabela com `organization_id`:

```sql
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchants_tenant_isolation ON merchants
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);
```

A camada de aplicação (`src/lib/db/tenant-context.ts`) define `app.current_org_id` no início de cada request via `SET LOCAL` dentro de transação. Prisma conecta com role que **respeita** RLS. `SUPER_ADMIN` usa role Postgres privilegiada que **bypassa** RLS (ADR-0001).

## Entidades futuras (não criar ainda)

`orders`, `order_items`, `products`, `categories`, `catalogs`, `customers`, `reviews`, `promotions`, `payments`, `financial_records`, `notifications`.

A estrutura suporta adicioná-las com o mesmo padrão de `organization_id` + RLS.
