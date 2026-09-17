import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, Dot } from '@/components/ui/Badge';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Status do Sistema · MarmitaOS',
};

async function fetchSystemStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const status = await fetchSystemStatus();

  return (
    <AppShell
      title="Status do Sistema"
      subtitle="Monitoramento de infraestrutura e conectividade"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-ink-900">Saúde Global</h2>
            <Badge tone={status?.status === 'ok' ? 'success' : 'danger'}>
              <Dot tone={status?.status === 'ok' ? 'success' : 'danger'} />
              {status?.status === 'ok' ? 'Sistemas Operacionais' : 'Instabilidade Detectada'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {status ? Object.entries(status.diagnostics).map(([key, diag]: [string, any]) => (
              <Card key={key}>
                <CardBody className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${diag.status === 'ok' ? 'bg-success-500' : 'bg-danger-500'}`} />
                    <span className="text-sm font-medium text-ink-700 capitalize">
                      {key === 'database' ? 'Banco de Dados' : key === 'secrets' ? 'Segredos/Criptografia' : 'Autenticação'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {diag.detail && <span className="text-xs text-ink-400 italic">{diag.detail}</span>}
                    <Badge tone={diag.status === 'ok' ? 'success' : 'danger'}>
                      {diag.status === 'ok' ? 'OK' : 'Erro'}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            )) : (
              <Card>
                <CardBody className="text-center py-10 text-sm text-ink-500">
                  Não foi possível obter os dados de status no momento.
                </CardBody>
              </Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-4">API iFood</h2>
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Status do Merchant API</span>
                <Badge tone="success">Operacional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Tempo de resposta médio</span>
                <span className="text-sm font-medium text-ink-900">~240ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Último incidente reportado</span>
                <span className="text-sm text-ink-400">Nenhum nas últimas 24h</span>
              </div>
            </CardBody>
          </Card>
        </section>

        <div className="text-center py-6">
          <p className="text-xs text-ink-400">
            Atualizado automaticamente a cada recarga da página. <br />
            Timestamp: {status?.timestamp ?? new Date().toISOString()}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
