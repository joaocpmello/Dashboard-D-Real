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
  organization?: {
    id: string;
    name: string;
    document: string;
    plan: any;
    maxMerchants: number;
  } | null;
};

// Cacheado por request — evita bater no Supabase + Prisma várias vezes.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: { organization: true },
        take: 1
      },
    },
  });

  if (!dbUser) {
    // Fallback gracioso: Cria o registro em public.users se o usuário existir no Auth mas não no DB.
    const isSuperAdmin = process.env.INITIAL_SUPER_ADMIN_EMAIL === user.email || user.email === 'joao@deliveryreal.com';
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || null,
        isSuperAdmin: isSuperAdmin,
      },
    });
    dbUser = {
      ...created,
      memberships: [],
    } as any;
  }

  const membership = (dbUser as any).memberships?.[0] ?? null;
  const org = membership?.organization;

  return {
    id: (dbUser as any).id,
    email: (dbUser as any).email,
    isSuperAdmin: (dbUser as any).isSuperAdmin,
    organizationId: membership?.organizationId ?? null,
    role: membership?.role ?? null,
    organization: org ? {
      id: org.id,
      name: org.name,
      document: org.document,
      plan: (org as any).plan ?? 'FREE',
      maxMerchants: (org as any).maxMerchants ?? 1,
    } : null,
  };
});

// Versão que redireciona quando não há sessão — usar em páginas protegidas.
export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect('/login');
  return session;
}
