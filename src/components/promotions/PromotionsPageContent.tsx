'use client';
import { useState } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, TableEmpty } from '@/components/ui/Table';
import { format } from 'date-fns';
import { MerchantSelect } from '@/components/merchants/MerchantSelect';

interface Promotion {
  id: string;
  name: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  startDate: string;
  endDate: string;
  status: string;
}

export function PromotionsPageContent() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [data, setData] = useState<Promotion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPromotions(merchantId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/promotions?merchantId=${merchantId}`);
      if (!res.ok) throw new Error('Erro ao carregar promoções.');
      const data = await res.json();
      setData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleMerchantChange = (id: string) => {
    setSelectedMerchant(id);
    fetchPromotions(id);
  };

  return (
    <>
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Campanhas e Promoções</CardTitle>
                <CardDescription>Visualize as promoções ativas em suas lojas iFood</CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <MerchantSelect
                  defaultValue=""
                  onChange={handleMerchantChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {!selectedMerchant && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-ink-500">Selecione uma loja acima para carregar as promoções.</p>
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-ink-400">Carregando promoções...</div>
            )}

            {error && (
              <div className="py-12 text-center text-danger-600">{error}</div>
            )}

            {!loading && !error && selectedMerchant && (
              <Table>
                <THead>
                  <TR>
                    <TH>Promoção</TH>
                    <TH className="text-center">Desconto</TH>
                    <TH className="text-center">Início</TH>
                    <TH className="text-center">Término</TH>
                    <TH className="text-right">Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {data && data.length === 0 ? (
                    <TableEmpty message="Nenhuma promoção ativa encontrada para esta loja." />
                  ) : (
                    data?.map(promo => (
                      <TR key={promo.id}>
                        <TD className="text-sm font-medium text-ink-900">{promo.name}</TD>
                        <TD className="text-center">
                          <Badge tone="success">
                            {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `R$ ${promo.discountValue.toFixed(2)}`}
                          </Badge>
                        </TD>
                        <TD className="text-center text-xs text-ink-600">
                          {format(new Date(promo.startDate), 'dd/MM/yyyy')}
                        </TD>
                        <TD className="text-center text-xs text-ink-600">
                          {format(new Date(promo.endDate), 'dd/MM/yyyy')}
                        </TD>
                        <TD className="text-right">
                          <Badge tone="info">{promo.status}</Badge>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </section>
    </>
  );
}
