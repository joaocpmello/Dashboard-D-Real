'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '@/components/ui/Table';
import { toast } from 'sonner';

interface MarginData {
  productId: string;
  name: string;
  price: number;
  cost: number;
  fee: number;
  netProfit: number;
  marginPercentage: number;
}

export default function MargemPage({
  orgName,
  user,
  merchants,
  isDemo
}: {
  orgName?: string;
  user: any;
  merchants: any[];
  isDemo: boolean;
}) {
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [margins, setMargins] = useState<MarginData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    if (merchants.length > 0 && !selectedMerchant) {
      setSelectedMerchant(merchants[0].id);
    }
  }, [merchants, selectedMerchant]);

  const fetchMargins = useCallback(async () => {
    if (!selectedMerchant) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/margins?merchantId=${selectedMerchant}`);
      if (!res.ok) throw new Error('Erro ao carregar margens');
      const data = await res.json();
      setMargins(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMerchant]);

  useEffect(() => {
    fetchMargins();
  }, [fetchMargins]);

  async function updateCost(productId: string, cost: number) {
    try {
      const res = await fetch('/api/catalog/costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, cost }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar custo');
      toast.success('Custo atualizado!');
      await fetchMargins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEditingId(null);
    }
  }

  const getStatus = (margin: number) => {
    if (margin < 0) return { label: 'Crítico', tone: 'error', color: 'bg-red-100 text-red-700' };
    if (margin < 15) return { label: 'Baixa', tone: 'warning', color: 'bg-yellow-100 text-yellow-700' };
    if (margin < 30) return { label: 'Média', tone: 'info', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Alta', tone: 'success', color: 'bg-green-100 text-green-700' };
  };

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink-900">Matriz de Rentabilidade</h2>
          <p className="text-sm text-ink-600">Identifique produtos &quot;Estrela&quot; e &quot;Abacaxi&quot; da sua operação.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-500">Loja:</span>
          <select
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
          >
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.name || m.corporateName}</option>
            ))}
          </select>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise de Margem Bruta</CardTitle>
              <CardDescription>Cálculo: (Preço - Taxas iFood) - Custo CMV</CardDescription>
            </div>
            <Badge tone="info">Taxa iFood: 20% (padrão)</Badge>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Produto</TH>
                  <TH className="text-right">Preço Venda</TH>
                  <TH className="text-right">CMV (Custo)</TH>
                  <TH className="text-right">Lucro Líquido</TH>
                  <TH className="text-right">Margem %</TH>
                  <TH className="text-center">Status</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR>
                    <TD colSpan={6} className="py-10 text-center text-sm text-ink-500">
                      Carregando dados...
                    </TD>
                  </TR>
                ) : margins.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="py-10 text-center text-sm text-ink-500">
                      Nenhum produto encontrado para esta loja.
                    </TD>
                  </TR>
                ) : (
                  margins.map((item) => {
                    const status = getStatus(item.marginPercentage);
                    return (
                      <TR key={item.productId}>
                        <TD className="font-medium text-ink-900">{item.name}</TD>
                        <TD className="text-right">
                          R$ {item.price.toFixed(2)}
                        </TD>
                        <TD className="text-right">
                          {editingId === item.productId ? (
                            <div className="flex justify-end gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 h-8"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => updateCost(item.productId, parseFloat(editValue))} className="h-8 px-2">
                                ✓
                              </Button>
                              <Button size="sm" onClick={() => setEditingId(null)} variant="ghost" className="h-8 px-2">
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:text-brand-600"
                              onClick={() => {
                                setEditingId(item.productId);
                                setEditValue(item.cost.toString());
                              }}
                            >
                              R$ {item.cost.toFixed(2)}
                            </span>
                          )}
                        </TD>
                        <TD className={`text-right font-medium ${item.netProfit < 0 ? 'text-red-600' : 'text-ink-900'}`}>
                          R$ {item.netProfit.toFixed(2)}
                        </TD>
                        <TD className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                            {item.marginPercentage.toFixed(1)}%
                          </span>
                        </TD>
                        <TD className="text-center">
                          <Badge tone={status.tone as any}>{status.label}</Badge>
                        </TD>
                      </TR>
                    );
                  })
                )}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
