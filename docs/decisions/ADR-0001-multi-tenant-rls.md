# ADR-0001 — Multi-tenant com RLS + Prisma

**Status:** Aceito • **Data:** 2026-08-15

## Contexto

SaaS precisa isolar dados entre Organizations. Prisma normalmente conecta via `service_role`, que **bypassa** RLS no Supabase. Sem RLS, qualquer query sem `WHERE organization_id = $org` vaza dados entre tenants.

## Decisão

Ativar **RLS em todas as tabelas multi-tenant**, mesmo usando Prisma com `service_role`.

Para o app (Next.js server) ter acesso legítimo, adotamos **dois papéis Postgres**:
- **Privilegiado** (`SUPER_ADMIN` da plataforma) — usa uma role Postgres que **bypassa** RLS;
- **Aplicação** — Prisma conecta com `service_role` e o app **deve** sempre passar `organization_id` no filtro.

Para o **frontend que usa Supabase client** (futuras queries client-side), RLS é a rede final.

## Consequências

- Prisma continua usando `service_role` no app (DX normal), mas a segurança depende dos repositórios filtrarem `organization_id` por Organization ativa;
- Toda nova query passa por um **helper de repositório** que exige `organizationId`;
- `SUPER_ADMIN` tem um cliente Prisma privilegiado pra cruzar tenants;
- Testes de isolamento multi-tenant são **obrigatórios**.

## Alternativas consideradas

- **Sem RLS, confia só no app**: rejeitado — defesa em profundidade é requisito crítico;
- **Trocar Prisma por Supabase client no app**: rejeitado — perde type-safety do Prisma e não escala pra queries complexas futuras.
