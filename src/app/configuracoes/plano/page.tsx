import { getPageContext } from '@/lib/auth/page-context';
import { listMerchants } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import PlanoClient from './components/PlanoClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Planos e Limites · MarmitaOS',
};

export default async function PlanoPage() {
  const ctx = await getPageContext();

  if (!ctx.isDemo) await requireSession();

  const merchants = await listMerchants(ctx.user.organizationId);

  // We need the organization data with plan and maxMerchants.
  // Since getCurrentOrganization in lib/data is used, let's use it.
  const { getCurrentOrganization } = await import('@/lib/data');
  const org = await getCurrentOrganization(ctx.user.organizationId);

  if (!org) {
    return <div>Organização não encontrada.</div>;
  }

  return (
    <AppShell
      title="Plano e Limites"
      subtitle="Gerencie a assinatura da sua organização"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <PlanoClient
        orgName={ctx.org?.name}
        user={{
          email: ctx.user.email,
          fullName: ctx.user.fullName,
          role: ctx.user.role,
          isSuperAdmin: ctx.user.isSuperAdmin,
        }}
        isDemo={ctx.isDemo}
        orgData={{
          plan: org.plan,
          maxMerchants: org.maxMerchants,
        }}
        merchantCount={merchants.length}
      />
    </AppShell>
  );
}
