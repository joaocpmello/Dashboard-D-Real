import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import AlertasClient from './components/AlertasClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alertas de Operação · MarmitaOS',
};

export default async function AlertasPage() {
  const ctx = await getPageContext();

  if (!ctx.isDemo) await requireSession();

  return (
    <AppShell
      title="Central de Alertas"
      subtitle="Monitoramento de incidentes operacionais"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <AlertasClient
        user={{
          email: ctx.user.email,
          fullName: ctx.user.fullName,
          role: ctx.user.role,
          isSuperAdmin: ctx.user.isSuperAdmin,
        }}
        isDemo={ctx.isDemo}
      />
    </AppShell>
  );
}
