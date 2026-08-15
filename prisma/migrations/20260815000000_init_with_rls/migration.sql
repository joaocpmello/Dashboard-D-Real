-- Migration: init (tabelas + RLS)
-- Aplicada via `prisma migrate deploy` ou `prisma migrate dev`.
-- O schema Prisma em prisma/schema.prisma deve estar em sincronia com este arquivo.

-- Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Tabelas
-- =============================================================================

CREATE TABLE "organizations" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text NOT NULL,
  "document"   text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "users" (
  "id"              uuid PRIMARY KEY,        -- = auth.users.id (Supabase)
  "email"           text NOT NULL UNIQUE,
  "full_name"       text,
  "is_super_admin"  boolean NOT NULL DEFAULT false,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');
CREATE TYPE "IfoodEnvironment" AS ENUM ('sandbox', 'production');

CREATE TABLE "organization_users" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id"         uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"            "UserRole" NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("organization_id", "user_id")
);
CREATE INDEX "organization_users_user_id_idx" ON "organization_users"("user_id");

CREATE TABLE "merchants" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "ifood_merchant_id" text NOT NULL,
  "name"             text,
  "corporate_name"   text,
  "status"           text,
  "last_synced_at"   timestamptz,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("organization_id", "ifood_merchant_id")
);
CREATE INDEX "merchants_organization_id_idx" ON "merchants"("organization_id");

CREATE TABLE "ifood_credentials" (
  "id"                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"             uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "environment"                 "IfoodEnvironment" NOT NULL,
  "client_id"                   text NOT NULL,
  "client_secret_cipher"        text NOT NULL,
  "client_secret_key_version"   integer NOT NULL DEFAULT 1,
  "access_token_cipher"         text,
  "access_token_expires_at"     timestamptz,
  "access_token_key_version"    integer,
  "created_at"                  timestamptz NOT NULL DEFAULT now(),
  "updated_at"                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("organization_id", "environment")
);
CREATE INDEX "ifood_credentials_organization_id_idx" ON "ifood_credentials"("organization_id");

CREATE TABLE "audit_logs" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "user_id"         uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action"          text NOT NULL,
  "entity"          text,
  "entity_id"       text,
  "metadata"        jsonb,
  "created_at"      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_logs_org_created_idx" ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs"("user_id", "created_at");

-- =============================================================================
-- Row Level Security — tabelas multi-tenant
-- =============================================================================
-- Estratégia (ver ADR-0001):
--   * app.current_org_id é setado pela camada de aplicação em cada request
--     dentro de uma transação com SET LOCAL.
--   * SUPER_ADMIN conecta com role Postgres privilegiada que BYPASSRLS.

ALTER TABLE "merchants"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ifood_credentials"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"         ENABLE ROW LEVEL SECURITY;

-- merchants
CREATE POLICY "merchants_tenant_isolation" ON "merchants"
  USING (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  );

-- ifood_credentials
CREATE POLICY "ifood_credentials_tenant_isolation" ON "ifood_credentials"
  USING (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  );

-- organization_users (filtra por organization_id)
CREATE POLICY "organization_users_tenant_isolation" ON "organization_users"
  USING (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_org_id', true) IS NOT NULL
    AND current_setting('app.current_org_id', true) <> ''
    AND "organization_id" = current_setting('app.current_org_id', true)::uuid
  );

-- audit_logs (escopo por organização; usuário pode ler eventos da própria Org)
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
  USING (
    current_setting('app.current_org_id', true) IS NULL   -- SUPER_ADMIN (sessão sem org)
    OR (
      current_setting('app.current_org_id', true) <> ''
      AND "organization_id" = current_setting('app.current_org_id', true)::uuid
    )
  );
