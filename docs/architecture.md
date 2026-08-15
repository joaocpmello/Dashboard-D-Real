# Arquitetura — SaaS de Gestão para Consultoria de Marmitarias iFood

> Documento vivo. Última atualização: FASE 0.

## 1. Visão geral

Plataforma **multi-tenant** para uma empresa de consultoria que gerencia operações de marmitarias integradas ao iFood. O SaaS permite:

- Administrar várias **Organizações** (clientes da consultoria);
- Cada Organização possui **uma ou mais Lojas (Merchants)** do iFood;
- Cada Organização possui **Usuários** com **papéis (RBAC)** próprios;
- Integração centralizada com a **API oficial do iFood** via **OAuth 2.0** (`client_credentials` para apps centralizadas);
- Auditoria de ações sensíveis;
- Dashboard inicial com dados reais.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14+ (App Router) + React + TypeScript |
| UI | Tailwind CSS + componentes reutilizáveis |
| Backend | Next.js Route Handlers + Server Actions (Node.js + TS) |
| Banco | PostgreSQL (Supabase) |
| ORM | Prisma (DATABASE_URL pooled + DIRECT_URL direct) |
| Auth | Supabase Auth + sessões server-side |
| RBAC | Próprio, enforced no servidor |
| Validação | Zod |
| Gráficos | Recharts (MVP) |
| Integração iFood | REST oficial + OAuth 2.0 (`client_credentials`) |
| Deploy | Vercel |

## 3. Entidade-raiz: Organization

```
SaaS
├── Organization A
│   ├── Users (via organization_users)
│   ├── Merchants (lojas)
│   └── IfoodCredentials (por ambiente)
├── Organization B
└── Organization C
```

**Regra de ouro:** todo dado de negócio carrega `organization_id` direta ou indiretamente. Isolamento multi-tenant aplicado em **4 camadas**:

1. **Autorização no servidor** (RBAC + ownership);
2. **Filtros `organization_id`** em todas as queries (Prisma helpers);
3. **RLS do Supabase** (políticas por `organization_id`);
4. **Testes automatizados** que falham se o isolamento vazar.

## 4. RBAC

| Papel | Escopo |
|---|---|
| `SUPER_ADMIN` | SaaS inteiro. Gerencia qualquer Organization. |
| `ADMIN` | Organization. Gerencia usuários e merchants. |
| `MANAGER` | Operação das lojas. |
| `OPERATOR` | Operações permitidas. Não gerencia usuários. |
| `VIEWER` | Somente leitura. |

RBAC é **enforced exclusivamente no servidor**. O frontend é desacreditado por design — qualquer cliente HTTP pode chamar as APIs, então a checagem está em cada handler/rota.

## 5. Segurança — regras inegociáveis

- `client_secret` do iFood **nunca** vai pra frontend, código client-side, logs, ou variáveis `NEXT_PUBLIC_*`;
- Tokens iFood ficam só no servidor;
- `access_token`, `refresh_token`, senhas: nunca em logs;
- `.env.example` sem valores reais;
- RLS ativo em todas as tabelas multi-tenant;
- Validação de input com **Zod** em toda entrada;
- Erros genéricos ao cliente; detalhes só em logs internos.

## 6. Fluxo de integração iFood

```
[Navegador]
   │  HTTPS (cookies HttpOnly)
   ▼
[Next.js Server — Route Handlers]
   │  valida sessão + RBAC + organization_id
   ▼
[IfoodClient]  ──→  [IfoodAuthService]
   │                       │  cache de token (server-side, em memória por processo)
   │                       ▼
   │                POST /authentication/v1.0/oauth/token  (client_credentials)
   │                       │
   │                       ▼
   │                access_token (TTL ~6h, expira → reemite)
   ▼
[iFood Merchant API — merchant-api.ifood.com.br]
```

### Endpoints oficiais confirmados (FASE 0)

- **Token:** `POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token`
  - Body: `grantType=client_credentials&clientId=...&clientSecret=...`
  - Resposta: `{ accessToken, type: "bearer", expiresIn }`
- **Merchant base:** `https://merchant-api.ifood.com.br/merchant/v1.0`
- **Endpoints MVP (somente leitura):**
  - `GET /merchants?page=&size=` — lista lojas
  - `GET /merchants/{merchantId}` — detalhes
  - `GET /merchants/{merchantId}/status` — status operacional

> Referência oficial: https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/endpoints

### Ambientes (sandbox × produção)

A documentação oficial **não publica hosts separados** para sandbox e produção. A separação é feita via **credenciais (`clientId`/`clientSecret`) distintas**, emitidas pelo portal do developer para cada ambiente. **Decisão arquitetural:** manteremos **uma única URL base** e duas coleções de credenciais por Organization, selecionadas por `IFOOD_ENVIRONMENT` (`sandbox` | `production`).

> **Por que essa decisão:** a doc oficial não retorna host de sandbox distinto, e inventar um host quebra o cliente. Quando o iFood publicar host separado, ajustamos.

## 7. Camadas de código

```
src/
├── app/
│   ├── (auth)/             # login, signup
│   ├── (app)/              # rotas autenticadas
│   │   ├── dashboard/
│   │   ├── lojas/
│   │   ├── usuarios/
│   │   ├── configuracoes/
│   │   └── (preparadas) pedidos/ cardapio/ avaliacoes/ promocoes/ relatorios/
│   └── api/                # route handlers internos
├── components/             # UI reutilizável
├── lib/
│   ├── supabase/           # client server + middleware
│   ├── ifood/              # IfoodClient, IfoodAuthService, IfoodMerchantService, types/
│   ├── auth/               # helpers de sessão e RBAC
│   └── db/                 # prisma client + helpers multi-tenant
├── services/               # regras de negócio (orquestram repositories + ifood)
├── repositories/           # acesso a dados (Prisma) com filtros organization_id
├── schemas/                # Zod
├── types/
└── utils/
```

## 8. Banco de dados (resumo — detalhes em `docs/database.md`)

Entidades MVP:
- `organizations`
- `organization_users` (associação + role)
- `users` (espelho server-side do `auth.users` do Supabase)
- `merchants`
- `ifood_credentials` (por ambiente)
- `audit_logs`

Preparado para (não implementado):
`orders`, `order_items`, `products`, `categories`, `catalogs`, `customers`, `reviews`, `promotions`, `payments`, `financial_records`, `notifications`.

## 9. Variáveis de ambiente

Veja `.env.example`. Princípios:
- Tudo que é secret **nunca** é `NEXT_PUBLIC_*`;
- Conexão com banco em pool + direct separadas;
- Credenciais iFood separadas por ambiente.

## 10. MVP — fora de escopo

Não implementar agora (a arquitetura **permite** mas não entrega):
- Sistema financeiro completo, billing, marketplace, Redis, Kubernetes, microservices, IA, automações complexas, filas.

## 11. Princípios

`SOLID` quando aplicável • `DRY` • `KISS` • tipagem forte • Zod em toda entrada • autorização server-side sempre • abstrações só quando necessárias.
