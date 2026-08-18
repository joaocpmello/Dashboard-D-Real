/* eslint-disable */
// Verify that expected tables exist and that RLS is enabled on tenant tables.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envFile = process.argv[2] || '.env.local';
const txt = fs.readFileSync(path.join(__dirname, '..', envFile), 'utf8');
for (const line of txt.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = val;
}

const expected = [
  'users',
  'organizations',
  'organization_users',
  'merchants',
  'ifood_credentials',
  'audit_logs',
];

const prisma = new PrismaClient({ log: ['error'] });

(async () => {
  try {
    // 1) Check tables presence
    const tablesRows = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name;
    `, expected);

    const found = tablesRows.map((r) => r.table_name);
    const missing = expected.filter((t) => !found.includes(t));
    console.log('Tabelas encontradas:', found.join(', ') || '(nenhuma)');
    if (missing.length) {
      console.log('Tabelas ausentes:', missing.join(', '));
    } else {
      console.log('Todas as tabelas esperadas estão presentes.');
    }

    // 2) RLS status (multi-tenant tables)
    const rlsRows = await prisma.$queryRawUnsafe(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname = ANY($1)
      ORDER BY c.relname;
    `, ['organizations', 'organization_users', 'merchants', 'ifood_credentials', 'audit_logs', 'users']);
    console.log('RLS status:');
    for (const r of rlsRows) {
      console.log(`  - ${r.table_name}: rls_enabled=${r.rls_enabled}, rls_forced=${r.rls_forced}`);
    }

    // 3) Policies
    const policies = await prisma.$queryRawUnsafe(`
      SELECT schemaname, tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    if (policies.length === 0) {
      console.log('Políticas RLS: nenhuma encontrada.');
    } else {
      console.log(`Políticas RLS: ${policies.length}`);
      for (const p of policies) {
        console.log(`  - ${p.tablename}.${p.policyname} (${p.cmd}) roles=${p.roles}`);
      }
    }
  } catch (e) {
    console.error('Erro:', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
