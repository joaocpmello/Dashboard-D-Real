import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, Dot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { IntegrationStatus } from '@/components/dashboard/IntegrationStatus';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurações · MarmitaOS',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
  VIEWER: 'Visualizador',
};

export default async function ConfiguracoesPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const canManageCreds = ctx.user.isSuperAdmin || ctx.user.role === 'ADMIN';

  return (
    <AppShell
      title="Configurações"
      subtitle="Organização, credenciais iFood e segurança"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Organização */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Organização</CardTitle>
                <CardDescription>Identidade da empresa cliente da consultoria</CardDescription>
              </div>
              <Badge tone="info">Em breve · edição</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="org-name">Nome fantasia</Label>
                  <Input
                    id="org-name"
                    type="text"
                    value={ctx.org?.name ?? ''}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="org-doc">CNPJ</Label>
                  <Input
                    id="org-doc"
                    type="text"
                    value="12.345.678/0001-90"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="org-id">ID interno</Label>
                  <Input
                    id="org-id"
                    type="text"
                    value={ctx.org?.id ?? ''}
                    readOnly
                    disabled
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="org-created">Cliente desde</Label>
                  <Input
                    id="org-created"
                    type="text"
                    value={formatDate(ctx.org?.id ? new Date().toISOString() : null)}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Para alterar dados cadastrais da organização, fale com o time de
                consultoria MarmitaOS.
              </p>
            </CardBody>
          </Card>

          {/* Credenciais iFood */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Credenciais iFood</CardTitle>
                <CardDescription>
                  Client ID e client secret são criptografados em repouso (AES-256-GCM)
                </CardDescription>
              </div>
              {!canManageCreds && (
                <Badge tone="neutral">Somente ADMIN+</Badge>
              )}
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="client-id">Client ID · Sandbox</Label>
                  <Input
                    id="client-id"
                    type="text"
                    value="••••••••-••••-••••-••••-••••••••••••"
                    readOnly
                    disabled
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="client-secret-sb">Client Secret · Sandbox</Label>
                  <Input
                    id="client-secret-sb"
                    type="password"
                    value="••••••••••••••••••••••••••••"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="client-id-prod">Client ID · Produção</Label>
                  <Input
                    id="client-id-prod"
                    type="text"
                    placeholder="Não configurado"
                    readOnly
                    disabled
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="client-secret-prod">Client Secret · Produção</Label>
                  <Input
                    id="client-secret-prod"
                    type="password"
                    placeholder="Não configurado"
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-info-500/30 bg-info-50 px-3 py-2 text-xs text-info-700">
                <p className="font-medium">Como funciona a integração</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>O client secret é criptografado com AES-256-GCM antes de persistir.</li>
                  <li>Tokens de acesso ficam em cache em memória (server-only) por 5min antes da expiração.</li>
                  <li>Renovação automática e refresh em 401 com 1 retry.</li>
                  <li>Nenhum secret trafega pelo navegador — apenas pela API interna.</li>
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  leftIcon={<KeyIcon />}
                  disabled={!canManageCreds}
                  title={canManageCreds ? 'Em breve' : 'Requer ADMIN'}
                >
                  Atualizar credenciais
                </Button>
                <Button variant="ghost" disabled title="Em breve">
                  Testar conexão
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>Notificações e idioma da interface</CardDescription>
              </div>
              <Badge tone="warning">Em breve</Badge>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm text-ink-600">
                <ToggleRow
                  label="Avisar sobre mudanças de status das lojas"
                  hint="Receba um alerta sempre que uma loja abrir, fechar ou pausar."
                />
                <ToggleRow
                  label="Resumo diário por e-mail"
                  hint="Operações do dia anterior consolidadas às 8h."
                />
                <ToggleRow
                  label="Alertas de falha de sincronização"
                  hint="Notificação imediata quando uma sincronização iFood falhar."
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Integração */}
          <IntegrationStatus
            connected={ctx.org?.ifoodConnected ?? false}
            lastSyncAt={ctx.org?.ifoodLastSyncAt ?? null}
          />

          {/* Sessão atual */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sua sessão</CardTitle>
                <CardDescription>Identidade autenticada</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Row label="Nome" value={ctx.user.fullName ?? '—'} />
                <Row label="E-mail" value={ctx.user.email} />
                <Row
                  label="Papel"
                  value={
                    ctx.user.isSuperAdmin
                      ? <Badge tone="brand">Super Admin</Badge>
                      : ctx.user.role
                        ? <Badge tone="info">{ROLE_LABEL[ctx.user.role] ?? ctx.user.role}</Badge>
                        : '—'
                  }
                />
                <Row
                  label="Organização"
                  value={ctx.org?.name ?? '—'}
                />
              </dl>
            </CardBody>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Princípios aplicados pela plataforma</CardDescription>
              </div>
              <Badge tone="success">
                <Dot tone="success" /> Ativo
              </Badge>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm text-ink-600">
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Credenciais criptografadas em repouso (AES-256-GCM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Sessões via cookies HttpOnly + SameSite=Lax</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Audit log de todas as ações sensíveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Isolamento multi-tenant com RLS no Postgres</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Tokens iFood nunca trafegam pelo navegador</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right text-sm text-ink-800">{value}</dd>
    </div>
  );
}

function ToggleRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50/40 p-3">
      <div>
        <p className="font-medium text-ink-800">{label}</p>
        <p className="text-xs text-ink-500">{hint}</p>
      </div>
      <span
        className="mt-1 inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-ink-200 px-0.5"
        aria-disabled
        title="Em breve"
      >
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </span>
    </div>
  );
}

function Check() {
  return (
    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success-500/15 text-success-700">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
      </svg>
    </span>
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
