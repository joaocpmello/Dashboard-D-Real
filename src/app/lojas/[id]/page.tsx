import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, Dot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MerchantStatus } from '@/components/ui/MerchantStatus';
import { EmptyState } from '@/components/ui/States';
import { getPageContext } from '@/lib/auth/page-context';
import { getMerchant, listMerchants } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { orderRepo } from '@/repositories/orders';
import { categoryRepo } from '@/repositories/categories';
import { productRepo } from '@/repositories/products';
import { productPriceRepo } from '@/repositories/product-prices';
import { SyncButton } from '@/components/lojas/SyncButton';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

export default async function MerchantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const merchant = await getMerchant(params.id, ctx.user.organizationId);
  if (!merchant) notFound();

  const allMerchants = await listMerchants(ctx.user.organizationId);
  const total = allMerchants.length;

  // Fetch Store Data
  const recentOrders = await orderRepo.findMany({
    organizationId: ctx.user.organizationId || '',
    merchantId: merchant.id,
    take: 5,
  });

  const categories = await categoryRepo.findMany({
    organizationId: ctx.user.organizationId || '',
    merchantId: merchant.id,
  });

  const products = await productRepo.findMany({
    organizationId: ctx.user.organizationId || '',
    merchantId: merchant.id,
  });

  // Get latest prices for a few top products to display in the summary
  const topProducts = await Promise.all(
    products.slice(0, 4).map(async (p) => {
      const price = await productPriceRepo.findLatest({
        organizationId: ctx.user.organizationId || '',
        productId: p.id,
      });
      return { ...p, currentPrice: price?.price ?? 0 };
    })
  );

  return (
    <AppShell
      title={merchant.name}
      subtitle="Detalhes da loja"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
      actions={
        <Link
          href="/lojas"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          ← Todas as lojas
        </Link>
      }
    >
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
              <path d="M3 9 5 4h14l2 5" />
              <path d="M5 9v11h14V9" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-ink-900">
                {merchant.name}
              </h2>
              <MerchantStatus value={merchant.status} />
            </div>
            {merchant.corporateName && merchant.corporateName !== merchant.name && (
              <p className="mt-0.5 text-sm text-ink-500">{merchant.corporateName}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
              <span>
                ID iFood:{' '}
                <span className="font-mono text-ink-700">{merchant.ifoodMerchantId}</span>
              </span>
              {merchant.city && (
                <>
                  <span className="text-ink-300">•</span>
                  <span>{merchant.city}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SyncButton
            label="Sincronizar"
            endpoint="/api/merchants/sync" // General sync
            merchantId={merchant.id}
            organizationId={ctx.user.organizationId || ''}
            icon={<SyncIcon />}
          />
          <Button variant="primary" leftIcon={<KeyIcon />} disabled>
            Atualizar credenciais
          </Button>
        </div>
      </div>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Resumo operacional</CardTitle>
                <CardDescription>Visão consolidada desta loja no iFood</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label="Status" value={<MerchantStatus value={merchant.status} />} />
                <Field
                  label="Última sincronização"
                  value={
                    <span className="text-ink-800">
                      {formatRelative(merchant.lastSyncedAt)}
                      <span className="block text-xs text-ink-500">
                        {formatDateTime(merchant.lastSyncedAt)}
                      </span>
                    </span>
                  }
                />
                <Field label="Cidade" value={merchant.city ?? '—'} />
                <Field
                  label="Organização"
                  value={ctx.org?.name ?? '—'}
                />
                <Field
                  label="ID interno"
                  value={
                    <span className="font-mono text-xs text-ink-700">{merchant.id}</span>
                  }
                />
                <Field
                  label="Ambiente"
                  value={<Badge tone="info">Sandbox</Badge>}
                />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <CardDescription>Últimos pedidos recebidos via iFood</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <SyncButton
                    label="Sincronizar"
                    endpoint="/api/orders/sync"
                    merchantId={merchant.id}
                    organizationId={ctx.user.organizationId || ''}
                    icon={<SyncIcon />}
                  />
                  <Link
                    href="/pedidos"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Ver Todos os Pedidos →
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="Nenhum pedido recente"
                  description="Os pedidos sincronizados aparecerão aqui."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-ink-100 text-xs uppercase text-ink-400">
                      <tr>
                        <th className="pb-2 font-medium">Pedido</th>
                        <th className="pb-2 font-medium">Cliente</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="group hover:bg-ink-50/50">
                          <td className="py-3 font-mono text-xs text-ink-600">
                            {order.ifoodOrderId.slice(-8)}
                          </td>
                          <td className="py-3 font-medium text-ink-900">
                            {order.customerName ?? 'Cliente anônimo'}
                          </td>
                          <td className="py-3 text-ink-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total))}
                          </td>
                          <td className="py-3">
                            <Badge tone={order.status === 'DELIVERED' ? 'success' : 'neutral'}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-ink-500">
                            {formatDateTime(order.createdAt ? order.createdAt.toISOString() : null)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resumo do Cardápio</CardTitle>
                  <CardDescription>Itens sincronizados com a loja</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <SyncButton
                    label="Sincronizar"
                    endpoint="/api/catalog/sync"
                    merchantId={merchant.id}
                    organizationId={ctx.user.organizationId || ''}
                    icon={<SyncIcon />}
                  />
                  <Link
                    href="/cardapio"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Gerenciar Cardápio →
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-ink-50 p-4 text-center">
                  <p className="text-2xl font-bold text-ink-900">{categories.length}</p>
                  <p className="text-xs text-ink-500">Categorias</p>
                </div>
                <div className="rounded-xl bg-ink-50 p-4 text-center">
                  <p className="text-2xl font-bold text-ink-900">{products.length}</p>
                  <p className="text-xs text-ink-500">Produtos</p>
                </div>
              </div>
              {products.length === 0 ? (
                <EmptyState
                  title="Cardápio vazio"
                  description="Sincronize a loja para importar os itens do iFood."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 transition-colors hover:bg-ink-50/50">
                      <div className="h-10 w-10 shrink-0 rounded-md bg-ink-100" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{product.name}</p>
                        <p className="text-xs font-semibold text-brand-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(product.currentPrice))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <ReviewsSection merchantId={merchant.id} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Integração iFood</CardTitle>
                <CardDescription>Status técnico da conexão</CardDescription>
              </div>
              <Badge tone="success">
                <Dot tone="success" />
                Conectado
              </Badge>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Field
                  label="Token"
                  value={
                    <span className="font-medium text-ink-800">Renovação automática</span>
                  }
                />
                <Field
                  label="Criptografia"
                  value={
                    <span className="font-medium text-ink-800">AES-256-GCM</span>
                  }
                />
                <Field
                  label="Último erro"
                  value={
                    <span className="font-medium text-ink-800">Nenhum registrado</span>
                  }
                />
              </dl>
              <p className="mt-4 text-xs text-ink-500">
                Credenciais nunca são expostas no cliente. Toda chamada passa por
                uma API interna e é auditada.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Posição na organização</CardTitle>
                <CardDescription>{total} loja(s) vinculada(s)</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-600">
                Esta loja faz parte de um total de <strong>{total}</strong> lojas
                vinculadas à organização atual. Toda alteração feita aqui é
                propagada via audit log para sua equipe de consultoria.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 21v-5h5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9" />
      <path d="m17 6 3 3" />
    </svg>
  );
}
