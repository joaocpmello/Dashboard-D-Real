import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

export type SessionUser = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  organizationId: string | null; // null para SUPER_ADMIN sem Org ativa
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER' | null;
};

// Cacheado por request — evita bater no Supabase + Prisma várias vezes.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { take: 1 } },
  });
  if (!dbUser) return null;

  const membership = dbUser.memberships[0] ?? null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    isSuperAdmin: dbUser.isSuperAdmin,
    organizationId: membership?.organizationId ?? null,
    role: membership?.role ?? null,
  };
});

// Versão que redireciona quando não há sessão — usar em páginas protegidas.
export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect('/login');
  return session;
}
