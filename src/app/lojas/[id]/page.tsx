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
          <Button variant="secondary" leftIcon={<SyncIcon />} disabled>
            Sincronizar
          </Button>
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
              <div>
                <CardTitle>Pedidos</CardTitle>
                <CardDescription>Recebidos, em andamento e concluídos hoje</CardDescription>
              </div>
              <Badge tone="warning">Em breve</Badge>
            </CardHeader>
            <CardBody>
              <EmptyState
                title="Módulo de pedidos em desenvolvimento"
                description="A próxima grande entrega: receber pedidos iFood em tempo real, gerenciar status, cancelamentos e histórico completo por loja."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cardápio</CardTitle>
                <CardDescription>Itens, preços, disponibilidade e categorias</CardDescription>
              </div>
              <Badge tone="warning">Em breve</Badge>
            </CardHeader>
            <CardBody>
              <EmptyState
                title="Cardápio integrado em breve"
                description="Sincronização com o cardápio do iFood e gestão de itens, categorias, fotos e preços."
              />
            </CardBody>
          </Card>
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
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
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
