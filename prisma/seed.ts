/**
 * Seed: cria/promove o primeiro SUPER_ADMIN do SaaS.
 *
 * - Lê INITIAL_SUPER_ADMIN_EMAIL do .env
 * - Encontra o usuário no Supabase Auth pelo e-mail
 * - Se não existir, falha com instrução clara
 * - Garante a linha em `users` com isSuperAdmin = true
 *
 * Uso:
 *   pnpm tsx prisma/seed.ts
 *
 * Não tenta criar Organization — esse é um passo separado, feito via UI.
 */

import { createSupabaseAdminClient } from '../src/lib/supabase/admin';
import { prisma } from '../src/lib/db/prisma';

async function main() {
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error(
      'Defina INITIAL_SUPER_ADMIN_EMAIL no .env antes de rodar o seed.',
    );
    process.exit(1);
  }

  const supabase = createSupabaseAdminClient();

  // 1) Listar usuários do Auth pelo e-mail.
  // O SDK admin não tem "getUserByEmail"; usamos listUsers e filtramos.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error('Falha ao listar usuários do Supabase:', error.message);
    process.exit(1);
  }

  const authUser = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!authUser) {
    console.error(
      `Usuário com e-mail "${email}" não existe no Supabase Auth.\n` +
        'Crie-o pelo painel do Supabase (Authentication → Users → Add user) ou ' +
        'via fluxo de signup antes de rodar o seed.',
    );
    process.exit(1);
  }

  // 2) Espelhar no nosso banco e promover.
  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: authUser.email!,
      fullName: (authUser.user_metadata?.full_name as string | undefined) ?? null,
      isSuperAdmin: true,
    },
    update: {
      isSuperAdmin: true,
      email: authUser.email!,
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
    await prisma.$disconnect();
  });
