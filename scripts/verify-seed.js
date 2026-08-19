/* eslint-disable */
// Verify state after seed: SUPER_ADMIN row + Organization existence.
const fs = require('fs');
const path = require('path');

// Load .env.local manually (no dotenv dependency).
const txt = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
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

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const email = (process.env.INITIAL_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  // Use DIRECT_URL (port 5432) — pgBouncer pooled connection does not support
  // prepared statements reliably for ad-hoc scripts.
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });

  // 1) Check public.users
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('FAIL: user not found in public.users');
    process.exit(1);
  }
  console.log('✓ public.users row:');
  console.log('  id             =', user.id);
  console.log('  email          =', user.email);
  console.log('  fullName       =', user.fullName);
  console.log('  isSuperAdmin   =', user.isSuperAdmin);
  console.log('  emailVerified  =', user.emailVerified);
  console.log('  createdAt      =', user.createdAt.toISOString());

  // 2) Cross-check with Supabase Auth (admin listUsers)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error('FAIL listing Supabase Auth users:', error.message);
    process.exit(1);
  }
  const authUser = data.users.find((u) => (u.email || '').toLowerCase() === email);
  if (!authUser) {
    console.error('FAIL: user not found in Supabase Auth');
    process.exit(1);
  }
  console.log('\n✓ Supabase Auth row:');
  console.log('  id    =', authUser.id);
  console.log('  email =', authUser.email);
  console.log('  ids match =', authUser.id === user.id);

  // 3) Organizations
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, document: true, createdAt: true },
  });
  console.log(`\nOrganizations count = ${orgs.length}`);
  for (const o of orgs) {
    console.log(`  - ${o.name} (doc=${o.document}) [${o.id}] @ ${o.createdAt.toISOString()}`);
  }

  // 4) organization_users for our super-admin
  const memberships = await prisma.organizationUser.findMany({
    where: { userId: user.id },
    include: { organization: { select: { name: true, document: true } } },
  });
  console.log(`\nMemberships for SUPER_ADMIN = ${memberships.length}`);
  for (const m of memberships) {
    console.log(`  - role=${m.role} org=${m.organization.name}`);
  }

  // 5) Quick merchants count
  const merchants = await prisma.merchant.count();
  console.log(`\nMerchants count = ${merchants}`);

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
