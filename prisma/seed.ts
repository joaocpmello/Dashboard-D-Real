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
  const emailsToProvision = [
    process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase(),
    'joao@deliveryreal.com',
    'dashdreal@hotmail.com',
  ].filter((e): e is string => !!e);

  if (emailsToProvision.length === 0) {
    console.error(
      'Nenhum e-mail de Super Admin definido. Defina INITIAL_SUPER_ADMIN_EMAIL no .env.',
    );
    process.exit(1);
  }

  const supabase = createSupabaseAdminClient();

  for (const email of emailsToProvision) {
    console.log(`Provisionando Super Admin: ${email}...`);

    // 1) Verificar se o usuário existe no Supabase Auth.
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`Falha ao listar usuários para ${email}:`, listError.message);
      continue;
    }

    let authUser = users.find((u) => u.email?.toLowerCase() === email);

    // 2) Se não existir, criar o usuário no Supabase Auth.
    if (!authUser) {
      console.log(`Usuário ${email} não encontrado no Auth. Criando...`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'Password123!', // Senha padrão temporária
        email_confirm: true,
      });

      if (createError) {
        console.error(`Erro ao criar usuário ${email} no Auth:`, createError.message);
        continue;
      }
      authUser = createData.user;
      console.log(`✓ Usuário ${email} criado no Auth.`);
    }

    // 3) Espelhar no nosso banco e promover.
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
