import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { IntegrationStatus } from '@/components/dashboard/IntegrationStatus';
import { MerchantTable } from '@/components/merchants/MerchantTable';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPageContext } from '@/lib/auth/page-context';
import { listMerchants, getDashboardAnalytics } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';

// Página autenticada — sempre dinâmica (depende da sessão do Supabase).
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard · MarmitaOS',
};

export default async function DashboardPage() {
  const ctx = await getPageContext();

  // Em produção real, exigimos sessão — middleware já redirecionou.
  if (!ctx.isDemo) await requireSession();

  const merchants = await listMerchants(ctx.user.organizationId);
  const analytics = await getDashboardAnalytics(ctx.user.organizationId);
  const activeMerchants = merchants.filter((m) => (m.status ?? '').toUpperCase() === 'OPEN').length;
  const total = merchants.length;

  const firstName = (ctx.user.fullName ?? ctx.user.email).split(/\s|@/)[0] ?? 'usuário';

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visão geral da sua operação"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <section className="mb-6 rounded-2xl border border-ink-200 bg-gradient-to-br from-white via-white to-brand-50/40 p-6 shadow-card">
        <p className="text-sm text-ink-500">Olá, {firstName}</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink-900">
          Acompanhe suas marmitarias em tempo real
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Integração iFood ativa, credenciais protegidas e gestão multi-tenant pronta.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lojas"
          value={String(total)}
          hint="Vinculadas à organização"
          tone="brand"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M3 9 5 4h14l2 5" />
              <path d="M5 9v11h14V9" />
            </svg>
          }
        />
        <StatCard
          label="Lojas ativas"
          value={String(activeMerchants)}
          hint="Abertas no iFood"
          tone="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M5 12 10 17 20 7" />
            </svg>
          }
        />
        <StatCard
          label="Pedidos hoje"
          value="—"
          hint="Disponível após integração de pedidos"
          tone="info"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 4h2l2 12h11l2-8H7" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
            </svg>
          }
        />
        <StatCard
          label="Faturamento hoje"
          value="—"
          hint="Disponível após integração de pedidos"
          tone="warning"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M12 3v18" />
              <path d="M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8" />
            </svg>
          }
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lojas da organização</CardTitle>
                  <CardDescription>{total} loja(s) vinculada(s) ao iFood</CardDescription>
                </div>
                <Link
                  href="/lojas"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Ver todas →
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {merchants.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-ink-500">
                  Nenhuma loja vinculada ainda.
                </div>
              ) : (
                <div className="px-0">
                  <MerchantTable rows={merchants.slice(0, 5)} />
                </div>
              )}
            </CardBody>
          </Card>

          <AnalyticsCharts data={analytics ?? { revenueOverTime: [], statusDistribution: [] }} />
        </div>

        <div className="space-y-4">
          <IntegrationStatus
            connected={ctx.org?.ifoodConnected ?? false}
            lastSyncAt={ctx.org?.ifoodLastSyncAt ?? null}
          />

          <AlertsWidget />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Desempenho operacional</CardTitle>
                  <CardDescription>Resumo rápido</CardDescription>
                </div>
                <Badge tone="warning">Ativo</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-600">
                O monitoramento de performance agora inclui gráficos de faturamento e
                distribuição de status de pedidos em tempo real.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
