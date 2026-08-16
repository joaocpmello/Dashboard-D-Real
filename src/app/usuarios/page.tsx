import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge, Dot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UsersTable } from '@/components/users/UsersTable';
import { getPageContext } from '@/lib/auth/page-context';
import { listUsers } from '@/lib/data';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Usuários · MarmitaOS',
};

const ROLE_DESCRIPTION: Record<string, string> = {
  ADMIN: 'Gerencia lojas, usuários e credenciais iFood.',
  MANAGER: 'Gerencia usuários e acompanha operações; sem acesso financeiro.',
  OPERATOR: 'Executa operações do dia-a-dia nas lojas.',
  VIEWER: 'Apenas leitura.',
};

export default async function UsuariosPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const users = await listUsers(ctx.user.organizationId);
  const activeCount = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => !u.isSuperAdmin && u.role === 'ADMIN').length;
  const managerCount = users.filter((u) => !u.isSuperAdmin && u.role === 'MANAGER').length;
  const operatorCount = users.filter((u) => !u.isSuperAdmin && u.role === 'OPERATOR').length;
  const viewerCount = users.filter((u) => !u.isSuperAdmin && u.role === 'VIEWER').length;

  const canManage = ctx.user.isSuperAdmin || ctx.user.role === 'ADMIN' || ctx.user.role === 'MANAGER';

  return (
    <AppShell
      title="Usuários"
      subtitle="Membros com acesso à sua organização"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
      actions={
        canManage ? (
          <Button leftIcon={<PlusIcon />} disabled title="Em breve">
            Convidar usuário
          </Button>
        ) : undefined
      }
    >
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={String(users.length)}
          hint="Membros da organização"
          tone="brand"
          icon={<UsersIcon />}
        />
        <StatCard
          label="Ativos"
          value={String(activeCount)}
          hint="Acessos válidos"
          tone="success"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Administradores"
          value={String(adminCount)}
          hint="Papel ADMIN"
          tone="info"
          icon={<ShieldIcon />}
        />
        <StatCard
          label="Gerentes"
          value={String(managerCount)}
          hint="Papel MANAGER"
          tone="warning"
          icon={<CrownIcon />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Membros da organização</CardTitle>
                <CardDescription>
                  {users.length} usuário(s) — {activeCount} ativo(s)
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <UsersTable rows={users} canManage={canManage} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Distribuição por papel</CardTitle>
                <CardDescription>Composição atual da equipe</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <RoleRow label="Administradores" count={adminCount} total={users.length} tone="brand" />
              <RoleRow label="Gerentes" count={managerCount} total={users.length} tone="info" />
              <RoleRow label="Operadores" count={operatorCount} total={users.length} tone="neutral" />
              <RoleRow label="Visualizadores" count={viewerCount} total={users.length} tone="success" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Permissões por papel</CardTitle>
                <CardDescription>RBAC enforced no servidor</CardDescription>
              </div>
              <Badge tone="success">
                <Dot tone="success" /> Ativo
              </Badge>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                {Object.entries(ROLE_DESCRIPTION).map(([role, desc]) => (
                  <div key={role}>
                    <dt className="font-medium text-ink-800">{role}</dt>
                    <dd className="text-ink-500">{desc}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function RoleRow({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: 'brand' | 'info' | 'neutral' | 'success';
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  const colors: Record<typeof tone, string> = {
    brand: 'bg-brand-500',
    info: 'bg-info-500',
    neutral: 'bg-ink-400',
    success: 'bg-success-500',
  };
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-ink-700">{label}</span>
        <span className="font-medium text-ink-900">
          {count} <span className="text-xs text-ink-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full ${colors[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
      <circle cx="17" cy="8" r="3" />
      <path d="M16 14c3 0 6 1.5 6 4" />
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
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3 4 6v6c0 4.5 3 8.5 8 9 5-.5 8-4.5 8-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 7l4 5 5-7 5 7 4-5v12H3Z" />
    </svg>
  );
}
