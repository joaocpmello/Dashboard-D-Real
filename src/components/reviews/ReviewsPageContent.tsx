'use client';
import { useState } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { MerchantSelect } from '@/components/merchants/MerchantSelect';
import { StatCard } from '@/components/dashboard/StatCard';

export function ReviewsPageContent() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Nota Média Geral"
          value="—"
          hint="Média de todas as lojas"
          tone="brand"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total de Avaliações"
          value="—"
          hint="Volume total de feedbacks"
          tone="info"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Taxa de Resposta"
          value="—"
          hint="Avaliações respondidas"
          tone="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </section>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Filtrar por Loja</CardTitle>
                <CardDescription>Selecione uma unidade para ver as avaliações detalhadas</CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <MerchantSelect
                  defaultValue=""
                  onChange={setSelectedMerchant}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {selectedMerchant ? (
              <ReviewsSection merchantId={selectedMerchant} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-ink-500">Selecione uma loja acima para carregar os dados.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </>
  );
}
