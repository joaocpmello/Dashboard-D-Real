import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';
import { listCategories, listProducts } from '@/lib/data';
import { CatalogManager } from '@/components/catalog/CatalogManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cardápio · MarmitaOS',
};

export default async function CardapioPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  const categories = await listCategories(ctx.user.organizationId);
  const products = await listProducts(ctx.user.organizationId);

  const activeProducts = products.filter(p => p.active).length;

  return (
    <AppShell
      title="Cardápio"
      subtitle="Gerenciamento de produtos e categorias"
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
          Sincronizar Catálogo
        </Button>
      }
    >
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Categorias"
          value={String(categories.length)}
          hint="Total de categorias"
          tone="brand"
          icon={<CategoryIcon />}
        />
        <StatCard
          label="Produtos"
          value={String(products.length)}
          hint="Total de itens no catálogo"
          tone="success"
          icon={<ProductIcon />}
        />
        <StatCard
          label="Ativos"
          value={String(activeProducts)}
          hint="Disponíveis para venda"
          tone="info"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Inativos"
          value={String(products.length - activeProducts)}
          hint="Fora de estoque"
          tone="warning"
          icon={<PauseIcon />}
        />
      </section>

      <CatalogManager categories={categories} initialProducts={products} />
    </AppShell>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 6h16M4 12h16M4 18h16" />
      <path d="M4 6v12M20 6v12" />
    </svg>
  );
}
function ProductIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className || 'h-5 w-5'}>
      <path d="M20 7h-9m3 0v3m0-3l-3 3m3-3l3 3" />
      <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5 12l5 5L20 7" />
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
