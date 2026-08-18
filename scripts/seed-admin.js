/* eslint-disable */
// Standalone seed runner — NÃO importa o cliente Supabase admin guarded
// por `import 'server-only'`, pois o Next.js é o único provedor válido
// daquele virtual module. Aqui usamos o SDK Supabase direto (service role)
// apenas em tempo de execução Node, sem bundler — o guard continua ativo
// em qualquer build do Next ou em testes via vitest.
//
// O arquivo original `prisma/seed.ts` permanece como fonte canônica,
// mas este runner evita a fricção de bootstrap para uso via `tsx`.

const fs = require('fs');
const path = require('path');

// Carrega .env.local manualmente (sem dependência do loader do Next.js).
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

async function main() {
  const email = (process.env.INITIAL_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) {
    console.error('Defina INITIAL_SUPER_ADMIN_EMAIL no .env.local antes de rodar o seed.');
    process.exit(1);
  }

  // Supabase Admin direto (Node puro, sem guard).
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error('Falha ao listar usuários do Supabase:', error.message);
    process.exit(1);
  }

  const authUser = data.users.find((u) => (u.email || '').toLowerCase() === email);
  if (!authUser) {
    console.error(
      `Usuário com e-mail "${email}" não existe no Supabase Auth.\n` +
        'Crie-o pelo painel do Supabase (Authentication → Users → Add user) ou ' +
        'via fluxo de signup antes de rodar o seed.',
    );
    process.exit(1);
  }

  // Prisma via tsx (carrega o client gerado e respece paths do tsconfig).
  const { prisma } = require('../src/lib/db/prisma.ts');

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: authUser.email,
      fullName: (authUser.user_metadata && authUser.user_metadata.full_name) || null,
      isSuperAdmin: true,
    },
    update: {
      isSuperAdmin: true,
      email: authUser.email,
    },
  });

  console.log(`✓ SUPER_ADMIN garantido: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      const { prisma } = require('../src/lib/db/prisma.ts');
      await prisma.$disconnect();
    } catch (_) {}
  });
