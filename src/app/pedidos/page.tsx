import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { getPageContext } from '@/lib/auth/page-context';
import { listOrders } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';
import { OrderTable } from '@/components/orders/OrderTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pedidos · MarmitaOS',
};

export default async function PedidosPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const orders = await listOrders(ctx.user.organizationId);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
  const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <AppShell
      title="Pedidos"
      subtitle="Gestão de pedidos sincronizados via iFood"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
      actions={
        <Button variant="primary" disabled>
          Sincronizar Pedidos
        </Button>
      }
    >
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Pedidos Hoje"
          value={String(orders.length)}
          hint="Sincronizados do iFood"
          tone="brand"
          icon={<OrdersIcon />}
        />
        <StatCard
          label="Faturamento"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
          hint="Volume bruto de vendas"
          tone="success"
          icon={<MoneyIcon />}
        />
        <StatCard
          label="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
          hint="Valor médio por pedido"
          tone="info"
          icon={<ChartIcon />}
        />
        <StatCard
          label="Cancelamentos"
          value={String(cancelled)}
          hint="Pedidos não finalizados"
          tone="warning"
          icon={<CancelIcon />}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>
                Acompanhe o status e o fluxo de entrega de todas as lojas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <OrderTable orders={orders} />
        </CardBody>
      </Card>
    </AppShell>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M3 10h18" />
      <path d="M3 14h18" />
    </svg>
  );
}
function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 12V12" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 3v18h18" />
      <path d="M18 15l-4-4-2 2-4-4" />
    </svg>
  );
}
function CancelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
