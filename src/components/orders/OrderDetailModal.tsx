'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { OrderDetail } from '@/lib/data/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function OrderDetailModal({ orderId, isOpen, onClose }: Props) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error('Erro ao carregar detalhes do pedido.');
        const data = await res.json();
        setDetail(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Pedido">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-ink-500">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p>Carregando detalhes...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-danger-50 p-4 text-danger-700 border border-danger-200">
          {error}
        </div>
      )}

      {!loading && !error && detail && (
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-ink-400">Cliente</label>
              <p className="text-lg font-medium text-ink-900">{detail.customerName ?? '—'}</p>
              <p className="text-sm text-ink-500">{detail.customerPhone ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-ink-400">Endereço de Entrega</label>
              <p className="text-sm text-ink-900 leading-relaxed">{detail.customerAddress ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-ink-400">Data do Pedido</label>
              <p className="text-sm text-ink-900">
                {format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-ink-400">Status Atual</label>
              <div>
                <Badge tone={getStatusTone(detail.status)}>
                  {translateStatus(detail.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ink-900">Itens do Pedido</h4>
            <Table>
              <THead>
                <TR>
                  <TH>Produto</TH>
                  <TH className="text-center">Qtd</TH>
                  <TH className="text-right">Unit.</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {detail.items.map((item) => (
                  <TR key={item.id}>
                    <TD className="text-sm">{item.productName}</TD>
                    <TD className="text-center text-sm">{item.quantity}</TD>
                    <TD className="text-right text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                    </TD>
                    <TD className="text-right text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="flex justify-end pt-2">
              <div className="text-right">
                <span className="text-sm text-ink-500 mr-3">Valor Total:</span>
                <span className="text-xl font-bold text-ink-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {detail.statusHistory && detail.statusHistory.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink-900">Histórico de Status</h4>
              <div className="space-y-4 border-l-2 border-ink-100 pl-4">
                {detail.statusHistory.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-ink-300 ring-4 ring-white" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ink-700 font-medium">{translateStatus(step.status)}</span>
                      <span className="text-xs text-ink-400">
                        {format(new Date(step.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    PLACED: 'Recebido',
    CONFIRMED: 'Confirmado',
    DISPATCHED: 'Em Rota',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };
  return map[status] ?? status;
}

function getStatusTone(status: string) {
  const map: Record<string, any> = {
    DELIVERED: 'success',
    CANCELLED: 'danger',
    PLACED: 'info',
    CONFIRMED: 'brand',
    DISPATCHED: 'warning',
  };
  return map[status] ?? 'neutral';
}
