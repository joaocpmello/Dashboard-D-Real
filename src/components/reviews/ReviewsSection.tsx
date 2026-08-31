'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, TableEmpty } from '@/components/ui/Table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { IfoodReview, IfoodReviewSummary } from '@/lib/ifood/reviews';

type Props = {
  merchantId: string;
};

export function ReviewsSection({ merchantId }: Props) {
  const [data, setData] = useState<{ reviews: IfoodReview[], summary: IfoodReviewSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?merchantId=${merchantId}`);
        if (!res.ok) throw new Error('Erro ao carregar avaliações.');
        const data = await res.json();
        setData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [merchantId]);

  if (loading) return <div className="py-12 text-center text-ink-400">Carregando avaliações...</div>;
  if (error) return <div className="py-12 text-center text-danger-600">{error}</div>;
  if (!data) return null;

  const { reviews, summary } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Avaliações do iFood</CardTitle>
            <CardDescription>Feedback dos clientes e nota média da loja</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-ink-900">{summary.averageRating.toFixed(1)}</div>
            <div className="text-xs text-ink-500">{summary.totalReviews} avaliações</div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs font-medium text-ink-600 w-4">{star}★</span>
              <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${(summary.distribution[star as keyof typeof summary.distribution] / (summary.totalReviews || 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-400 w-8 text-right">
                {summary.distribution[star as keyof typeof summary.distribution]}
              </span>
            </div>
          ))}
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Cliente</TH>
              <TH className="text-center">Nota</TH>
              <TH>Comentário</TH>
              <TH className="text-right">Data</TH>
            </TR>
          </THead>
          <TBody>
            {reviews.length === 0 ? (
              <TableEmpty message="Nenhuma avaliação recebida até o momento." />
            ) : (
              reviews.map(review => (
                <TR key={review.id}>
                  <TD className="text-sm font-medium text-ink-900">{review.customerName ?? 'Cliente Anônimo'}</TD>
                  <TD className="text-center">
                    <Badge tone={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'info' : 'danger'}>
                      {review.rating}★
                    </Badge>
                  </TD>
                  <TD className="text-sm text-ink-600 italic">"{review.comment ?? 'Sem comentário'}"</TD>
                  <TD className="text-right text-xs text-ink-400">
                    {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardBody>
    </Card>
  );
}
