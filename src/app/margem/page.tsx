import { getPageContext } from '@/lib/auth/page-context';
import { listMerchants } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import MargemClient from './components/MargemClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Margens & CMV · MarmitaOS',
};

export default async function MargemPage() {
  const ctx = await getPageContext();

  if (!ctx.isDemo) await requireSession();

  const merchants = await listMerchants(ctx.user.organizationId);

  return (
    <AppShell
      title="Engenharia de Cardápio"
      subtitle="Análise de Margem e Rentabilidade"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <MargemClient
        user={{
          email: ctx.user.email,
          fullName: ctx.user.fullName,
          role: ctx.user.role,
          isSuperAdmin: ctx.user.isSuperAdmin,
        }}
        merchants={merchants}
        isDemo={ctx.isDemo}
      />
    </AppShell>
  );
}
