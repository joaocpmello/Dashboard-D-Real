'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { format } from 'date-fns';

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  cancellationRate: number;
}

interface Breakdown {
  merchantId: string;
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [merchants, setMerchants] = useState<{ id: string; name: string }[]>([]);

  const [filters, setFilters] = useState({
    startTime: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    endTime: format(new Date(), "yyyy-MM-dd"),
    selectedMerchants: [] as string[],
  });

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  async function fetchMerchants() {
    try {
      const res = await fetch('/api/merchants');
      const data = await res.json();
      if (data.ok) {
        setMerchants(data.data);
      }
    } catch (e) {
      console.error('Error fetching merchants', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReportData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startTime', filters.startTime);
      params.append('endTime', filters.endTime);
      if (filters.selectedMerchants.length > 0) {
        params.append('merchantIds', filters.selectedMerchants.join(','));
      }

      const res = await fetch(`/api/reports/sales?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setSummary(data.data.summary);
        setBreakdown(data.data.breakdown);
      }
    } catch (e) {
      console.error('Error fetching report', e);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const params = new URLSearchParams();
    params.append('startTime', filters.startTime);
    params.append('endTime', filters.endTime);
    if (filters.selectedMerchants.length > 0) {
      params.append('merchantIds', filters.selectedMerchants.join(','));
    }
    window.location.href = `/api/reports/export?${params.toString()}`;
  }

  function toggleMerchant(id: string) {
    setFilters(prev => ({
      ...prev,
      selectedMerchants: prev.selectedMerchants.includes(id)
        ? prev.selectedMerchants.filter(mId => mId !== id)
        : [...prev.selectedMerchants, id],
    }));
  }

  if (loading && !summary) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink">Relatórios de Performance</h1>
        <Button onClick={handleExport} variant="primary">
          Exportar Relatório (CSV)
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink/60">Data Início</label>
          <Input
            type="date"
            value={filters.startTime}
            onChange={e => setFilters(prev => ({ ...prev, startTime: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink/60">Data Fim</label>
          <Input
            type="date"
            value={filters.endTime}
            onChange={e => setFilters(prev => ({ ...prev, endTime: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink/60">Lojas</label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md">
            {merchants.map(m => (
              <label key={m.id} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${filters.selectedMerchants.includes(m.id) ? 'bg-brand text-white' : 'bg-ink/10 text-ink'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.selectedMerchants.includes(m.id)}
                  onChange={() => toggleMerchant(m.id)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-ink/60">Faturamento Total</p>
            <p className="text-2xl font-bold text-ink">R$ {summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-ink/60">Total de Pedidos</p>
            <p className="text-2xl font-bold text-ink">{summary.totalOrders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-ink/60">Ticket Médio</p>
            <p className="text-2xl font-bold text-ink">R$ {summary.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-ink/60">Taxa de Cancelamento</p>
            <p className="text-2xl font-bold text-ink">{summary.cancellationRate.toFixed(2)}%</p>
          </Card>
        </div>
      )}

      {/* Performance Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-ink">Performance por Loja</h2>
        </div>
        {loading ? (
          <LoadingState />
        ) : breakdown.length === 0 ? (
          <EmptyState title="Sem dados" description="Nenhum dado encontrado para o período selecionado." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Loja</TH>
                <TH className="text-right">Faturamento</TH>
                <TH className="text-right">Pedidos</TH>
                <TH className="text-right">Ticket Médio</TH>
              </TR>
            </THead>
            <TBody>
              {breakdown.map(b => (
                <TR key={b.merchantId}>
                  <TD>{b.name}</TD>
                  <TD className="text-right">R$ {b.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TD>
                  <TD className="text-right">{b.orders}</TD>
                  <TD className="text-right">R$ {b.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
