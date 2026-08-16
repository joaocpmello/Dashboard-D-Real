import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { MerchantFilters } from '@/components/merchants/MerchantFilters';
import { Button } from '@/components/ui/Button';
import { getPageContext } from '@/lib/auth/page-context';
import { listMerchants } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lojas · MarmitaOS',
};

export default async function LojasPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const merchants = await listMerchants(ctx.user.organizationId);
  const open = merchants.filter((m) => (m.status ?? '').toUpperCase() === 'OPEN').length;
  const paused = merchants.filter((m) => (m.status ?? '').toUpperCase() === 'PAUSED').length;
  const problems = merchants.filter((m) => (m.status ?? '').toUpperCase().includes('INTEGRATION')).length;

  return (
    <AppShell
      title="Lojas"
      subtitle="Lojas vinculadas ao iFood"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
      actions={
        <Button leftIcon={<SyncIcon />} variant="primary" disabled>
          Sincronizar agora
        </Button>
      }
    >
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={String(merchants.length)}
          hint="Vinculadas à organização"
          tone="brand"
          icon={<StoreIcon />}
        />
        <StatCard
          label="Abertas"
          value={String(open)}
          hint="Operando no iFood"
          tone="success"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Pausadas"
          value={String(paused)}
          hint="Temporariamente fora"
          tone="warning"
          icon={<PauseIcon />}
        />
        <StatCard
          label="Com problema"
          value={String(problems)}
          hint="Atenção necessária"
          tone="neutral"
          icon={<AlertIcon />}
        />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Todas as lojas</CardTitle>
            <CardDescription>
              Pesquise por nome, cidade ou ID iFood e filtre por status operacional.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <MerchantFilters rows={merchants} />
        </CardBody>
      </Card>
    </AppShell>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 9 5 4h14l2 5" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5 12 10 17 20 7" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3 2 21h20Z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}
