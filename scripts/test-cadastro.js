/* eslint-disable */
// Smoke-test E2E real do fluxo /cadastro contra Supabase.
//
// Executa exatamente o que a rota POST /api/cadastro faz:
//   1) valida email/documento não-duplicado;
//   2) cria auth.users + public.users + Organization + OrganizationUser (ADMIN);
//   3) tenta signInWithPassword com as credenciais recém-criadas;
//   4) valida o espelho e remove tudo.
//
// Usa o Prisma client + supabase admin (mesmas libs que /api/cadastro).

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const txt = fs.readFileSync(envPath, 'utf8');
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error('Faltam env vars.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const stamp = Date.now();
const email = `e2e-signup+${stamp}@deliveryreal.com`;
const password = 'TempLogin!E2E_' + stamp;
const orgName = `Org Smoke ${stamp}`;
const orgDocument = String(stamp).slice(-11).padStart(11, '7'); // 11 dígitos únicos

(async () => {
  // Carrega Prisma de forma lazy (gera o client).
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pré-checagens (devem passar — usamos timestamp)
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.users.find((u) => (u.email || '').toLowerCase() === email)) {
    console.error('prefixo de email colidiu');
    process.exit(1);
  }
  const orgByDoc = await prisma.organization.findUnique({ where: { document: orgDocument } });
  if (orgByDoc) {
    console.error('prefixo de documento colidiu');
    process.exit(1);
  }

  console.log('→ Criando auth.users...');
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Smoke User' },
  });
  if (createErr) throw new Error('createUser failed: ' + createErr.message);
  const userId = created.user.id;
  console.log('  user.id =', userId);

  console.log('→ Espelhando em public.users...');
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, fullName: 'Smoke User', isSuperAdmin: false },
    update: { email, fullName: 'Smoke User' },
  });

  console.log('→ Criando Organization + ADMIN membership...');
  const org = await prisma.organization.create({
    data: {
      name: orgName,
      document: orgDocument,
      users: { create: { userId, role: 'ADMIN' } },
    },
  });
  console.log('  organization.id =', org.id);

  console.log('→ Audit log...');
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId,
      action: 'organization.create',
      entity: 'Organization',
      entityId: org.id,
      metadata: { source: 'self_signup', name: org.name },
    },
  });

  // Validação: signInWithPassword
  console.log('→ signInWithPassword (caminho do browser)...');
  const anonClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signin, error: signinErr } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signinErr) {
    console.error('✗ signInWithPassword FAILED:', signinErr.message);
    process.exit(2);
  }
  console.log('✓ signInWithPassword SUCCESS');
  console.log('  has access_token  =', !!signin.session?.access_token);
  console.log('  has refresh_token =', !!signin.session?.refresh_token);

  const userRow = await prisma.user.findUnique({ where: { id: userId } });
  console.log('✓ public.users espelhado:', { id: userRow.id, email: userRow.email, isSuperAdmin: userRow.isSuperAdmin });

  const orgUserRow = await prisma.organizationUser.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId } },
  });
  console.log('✓ OrganizationUser role =', orgUserRow?.role);

  // Cleanup
  console.log('\n→ Limpando dados do teste...');
  await prisma.organization.delete({ where: { id: org.id } }); // cascade em OrgUser e AuditLog
  await prisma.user.delete({ where: { id: userId } }).catch(() => {}); // cascade em OrgUser
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  console.log(delErr ? '⚠ deleteUser falhou (idempotente): ' + delErr.message : '✓ auth.users removido');

  await prisma.$disconnect();
  console.log('\n✅ /cadastro end-to-end OK');
})().catch(async (e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
