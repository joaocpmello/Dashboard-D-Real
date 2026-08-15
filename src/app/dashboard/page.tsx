import { requireSession } from '@/lib/auth/session';

export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Olá, {session.email}.{' '}
        {session.isSuperAdmin
          ? 'Você é SUPER_ADMIN.'
          : `Papel na organização: ${session.role ?? '—'}`}
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Métricas reais serão carregadas via API interna na FASE 3.
      </p>
    </main>
  );
}
