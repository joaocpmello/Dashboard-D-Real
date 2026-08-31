// Helper para páginas autenticadas (Server Components).
// Combina sessão real (Supabase) com fallbacks de demo para apresentação.
import 'server-only';
import { getSessionUser } from '@/lib/auth/session';
import { dataMode, getCurrentOrganization } from '@/lib/data';
import type { Role } from '@/lib/data/types';

export type PageUser = {
  email: string;
  fullName: string | null;
  isSuperAdmin: boolean;
  role: Role | null;
  organizationId: string | null;
};

export type PageContext = {
  user: PageUser;
  org: {
    id: string;
    name: string;
    ifoodConnected: boolean;
    ifoodLastSyncAt: string | null;
  } | null;
  isDemo: boolean;
};

const DEMO_USER: PageUser = {
  email: 'admin@marmitaos.com.br',
  fullName: 'Carla Mendes',
  isSuperAdmin: false,
  role: 'ADMIN',
  organizationId: '00000000-0000-0000-0000-000000000000',
};

export async function getPageContext(): Promise<PageContext> {
  const demo = dataMode.isDemo();

  if (demo) {
    const org = await getCurrentOrganization(DEMO_USER.organizationId);
    return {
      user: DEMO_USER,
      org: org
        ? {
            id: org.id,
            name: org.name,
            ifoodConnected: org.ifoodConnected,
            ifoodLastSyncAt: org.ifoodLastSyncAt,
          }
        : null,
      isDemo: true,
    };
  }

  // Produção real: usar sessão real do Supabase.
  const session = await getSessionUser();
  if (!session) {
    // O middleware já redireciona, mas se chegou aqui sem sessão, trate como demo
    // para a página de login (não chegou aqui nesse caso).
    return { user: DEMO_USER, org: null, isDemo: true };
  }
  const org = await getCurrentOrganization(session.organizationId);
  return {
    user: {
      email: session.email,
      fullName: null,
      isSuperAdmin: session.isSuperAdmin,
      role: session.role,
      organizationId: session.organizationId,
    },
    org: org
      ? {
          id: org.id,
          name: org.name,
          ifoodConnected: org.ifoodConnected,
          ifoodLastSyncAt: org.ifoodLastSyncAt,
        }
      : null,
    isDemo: false,
  };
}
