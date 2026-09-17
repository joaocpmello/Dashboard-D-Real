import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import OrganizationsClient from './components/OrganizationsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestão de Organizações · MarmitaOS',
};

export default async function OrganizationsPage() {
  const ctx = await getPageContext();

  // Only SUPER_ADMIN can access this page
  if (!ctx.user.isSuperAdmin) {
    return <div className="p-10 text-center">Acesso Negado. Apenas Super Admins podem acessar esta página.</div>;
  }

  if (!ctx.isDemo) await requireSession();

  return (
    <AppShell
      title="Gestão de Organizações"
      subtitle="Painel administrativo de clientes do SaaS"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <OrganizationsClient />
    </AppShell>
  );
}
