import { AppShell } from '@/components/layout/AppShell';
import { ReviewsPageContent } from '@/components/reviews/ReviewsPageContent';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Avaliações · MarmitaOS',
};

export default async function ReviewsPage() {
  const ctx = await getPageContext();

  if (!ctx.isDemo) await requireSession();

  return (
    <AppShell
      title="Avaliações"
      subtitle="Gestão de feedback e satisfação dos clientes"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <ReviewsPageContent />
    </AppShell>
  );
}
