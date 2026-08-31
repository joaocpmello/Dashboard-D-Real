'use client';
import { useState } from 'react';
import { Table, THead, TBody, TR, TH, TD, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { OrderSummary } from '@/lib/data/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderDetailModal } from './OrderDetailModal';

interface OrderTableProps {
  orders: OrderSummary[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>ID iFood</TH>
            <TH>Cliente</TH>
            <TH>Data</TH>
            <TH>Status</TH>
            <TH className="text-right">Total</TH>
          </TR>
        </THead>
        <TBody>
          {orders.length === 0 ? (
            <TableEmpty message="Nenhum pedido encontrado para o período selecionado." />
          ) : (
            orders.map((order) => (
              <TR
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="cursor-pointer hover:bg-ink-50 transition-colors"
              >
                <TD className="font-mono text-xs">{order.ifoodOrderId}</TD>
                <TD>{order.customerName ?? '—'}</TD>
                <TD>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TD>
                <TD>
                  <Badge tone={getStatusTone(order.status)}>
                    {translateStatus(order.status)}
                  </Badge>
                </TD>
                <TD className="text-right font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </>
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
