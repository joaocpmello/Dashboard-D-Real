'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, THead, TBody, TR, TH, TD, TableEmpty } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { CategorySummary, ProductSummary } from '@/lib/data/types';

type Props = {
  categories: CategorySummary[];
  initialProducts: ProductSummary[];
};

export function CatalogManager({ categories, initialProducts }: Props) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>(initialProducts);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [adjustment, setAdjustment] = useState<string>('0');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (selectedCatId) {
      fetchProducts();
    }
  }, [selectedCatId, fetchProducts]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(\`/api/catalog?categoryId=\${selectedCatId}\`);
      const data = await res.json();
      setProducts(data);
      setSelectedProductIds(new Set());
    } catch (e) {
      console.error('Erro ao carregar produtos', e);
    }
  }, [selectedCatId]);

  function toggleProduct(id: string) {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  }

  const preview = products
    .filter(p => selectedProductIds.has(p.id))
    .map(p => {
      const multiplier = 1 + (parseFloat(adjustment || '0') / 100);
      const newPrice = Math.round(p.price * multiplier * 100) / 100;
      return { ...p, newPrice };
    });

  async function handleBulkUpdate() {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/catalog/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          adjustment: parseFloat(adjustment),
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar preços.');

      setIsPreviewOpen(false);
      setSelectedProductIds(new Set());
      setAdjustment('0');
      // Refresh products
      fetchProducts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Categories */}
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-ink-900">Categorias</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCatId ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              Todas as Categorias
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCatId === cat.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-ink-900">Produtos</h3>
              <p className="text-sm text-ink-500">Selecione produtos para reajuste em lote.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Ex: 10 ou -5"
                  value={adjustment}
                  onChange={e => setAdjustment(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-ink-400">%</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedProductIds.size === 0 || adjustment === '0'}
                onClick={() => setIsPreviewOpen(true)}
              >
                Reajustar
              </Button>
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH className="w-10"></TH>
                <TH>Produto</TH>
                <TH className="text-right">Preço Atual</TH>
                <TH className="text-center">Status</TH>
              </TR>
            </THead>
            <TBody>
              {products.length === 0 ? (
                <TableEmpty message="Nenhum produto encontrado nesta categoria." />
              ) : (
                products.map(p => (
                  <TR
                    key={p.id}
                    className={`group cursor-pointer transition-colors ${selectedProductIds.has(p.id) ? 'bg-brand-50/50' : 'hover:bg-ink-50'}`}
                    onClick={() => toggleProduct(p.id)}
                  >
                    <TD>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(p.id)}
                        onChange={(e) => toggleProduct(p.id)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      />
                    </TD>
                    <TD>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink-900">{p.name}</span>
                        <span className="text-xs text-ink-400">{p.description}</span>
                      </div>
                    </TD>
                    <TD className="text-right text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </TD>
                    <TD className="text-center">
                      <Badge tone={p.active ? 'success' : 'warning'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>

        {/* Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Confirmar Reajuste de Preços"
        >
          <div className="space-y-6">
            <p className="text-sm text-ink-600">
              Você está aplicando um ajuste de <strong className={parseFloat(adjustment) > 0 ? 'text-success-600' : 'text-danger-600'}>
                {adjustment > 0 ? `+${adjustment}%` : `${adjustment}%`}
              </strong> a {preview.length} produtos.
            </p>

            <Table>
              <THead>
                <TR>
                  <TH>Produto</TH>
                  <TH className="text-right">Preço Atual</TH>
                  <TH className="text-right">Novo Preço</TH>
                  <TH className="text-right">Dif.</TH>
                </TR>
              </THead>
              <TBody>
                {preview.map(p => (
                  <TR key={p.id}>
                    <TD className="text-sm">{p.name}</TD>
                    <TD className="text-right text-sm text-ink-400 line-through">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </TD>
                    <TD className="text-right text-sm font-bold text-ink-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.newPrice)}
                    </TD>
                    <TD className={`text-right text-xs font-medium ${p.newPrice > p.price ? 'text-success-600' : 'text-danger-600'}`}>
                      {p.newPrice > p.price ? '↑' : '↓'}
                      {Math.abs(p.newPrice - p.price).toFixed(2)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} disabled={isUpdating}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? 'Atualizando...' : 'Confirmar e Aplicar'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
