'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, TableEmpty } from '@/components/ui/Table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import type { IfoodReview, IfoodReviewSummary } from '@/lib/ifood/reviews';

type Props = {
  merchantId: string;
};

export function ReviewsSection({ merchantId }: Props) {
  const [data, setData] = useState<{ reviews: IfoodReview[], summary: IfoodReviewSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [replyingTo, setReplyingTo] = useState<IfoodReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyingTo) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          reviewId: replyingTo.id,
          text: replyText,
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar resposta.');

      setReplyingTo(null);
      setReplyText('');
      // Refresh data
      const refreshed = await fetch(`/api/reviews?merchantId=${merchantId}`).then(r => r.json());
      setData(refreshed);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
                  style={{ width: `${((summary.distribution[star as keyof typeof summary.distribution] ?? 0) / (summary.totalReviews || 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-400 w-8 text-right">
                {summary.distribution[star as keyof typeof summary.distribution] ?? 0}
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
              <TH className="text-right">Ação</TH>
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
                  <TD className="text-sm text-ink-600 italic">&quot;{review.comment ?? 'Sem comentário'}&quot;</TD>
                  <TD className="text-right text-xs text-ink-400">
                    {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(review);
                        setReplyText('');
                      }}
                    >
                      Responder
                    </Button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardBody>

      {replyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Responder Avaliação</CardTitle>
              <CardDescription>
                Sua resposta será enviada diretamente para o cliente via iFood.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleReply} className="space-y-4">
                <div className="p-3 rounded-lg bg-ink-50 text-sm italic text-ink-600 border border-ink-100">
                  &quot;{replyingTo.comment ?? 'Sem comentário'}&quot;
                </div>
                <div className="space-y-2">
                  <Label>Sua resposta</Label>
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Ex: Obrigado pelo feedback! Ficamos felizes que gostou..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </Card>
  );
}
