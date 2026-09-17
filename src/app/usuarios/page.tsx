import { AppShell } from '@/components/layout/AppShell';
import { getPageContext } from '@/lib/auth/page-context';
import { listUsers } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';
import UsuariosClient from './components/UsuariosClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Usuários · MarmitaOS',
};

export default async function UsuariosPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const users = await listUsers(ctx.user.organizationId);
  const canManage = ctx.user.isSuperAdmin || ctx.user.role === 'ADMIN' || ctx.user.role === 'MANAGER';

  return (
    <AppShell
      title="Usuários"
      subtitle="Membros com acesso à sua organização"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <UsuariosClient
        users={users}
        canManage={canManage}
        orgName={ctx.org?.name}
        isDemo={ctx.isDemo}
        user={{
          email: ctx.user.email,
          fullName: ctx.user.fullName,
          role: ctx.user.role,
          isSuperAdmin: ctx.user.isSuperAdmin,
        }}
      />
    </AppShell>
  );
}
