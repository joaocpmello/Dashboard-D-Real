import { AppShell } from '@/components/layout/AppShell';
import { PromotionsPageContent } from '@/components/promotions/PromotionsPageContent';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Promoções · MarmitaOS',
};

export default async function PromotionsPage() {
  const ctx = await getPageContext();

  if (!ctx.isDemo) await requireSession();

  return (
    <AppShell
      title="Promoções"
      subtitle="Gestão de campanhas e descontos do iFood"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <PromotionsPageContent />
    </AppShell>
  );
}
