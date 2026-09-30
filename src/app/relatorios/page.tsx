'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  FileDown
} from 'lucide-react';

interface StoreReportData {
  merchant: {
    id: string;
    name: string;
    ifoodMerchantId: string;
  };
  report: {
    financial: {
      grossRevenue: number;
      netRevenue: number;
      commissions: number;
      totalOrders: number;
      avgTicket: number;
    };
    operational: {
      cancellationRate: number;
      avgPrepTime: number;
      avgDeliveryTime: number;
      reviewsCount: number;
      avgRating: number;
    };
    period: {
      startTime: string;
      endTime: string;
    };
  };
}

export default function IfoodRestaurantReport() {
  const [merchantId, setMerchantId] = useState('');
  const [period, setPeriod] = useState({
    startTime: new Date(new Date().setHours(0,0,0,0)).toISOString(),
    endTime: new Date().toISOString(),
  });
  const [data, setData] = useState<StoreReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchMerchants();
  }, []);

  async function fetchMerchants() {
    try {
      const res = await fetch('/api/merchants');
      const data = await res.json();
      setMerchants(data.merchants || []);
    } catch (err) {
      toast.error('Erro ao carregar lojas');
    }
  }

  async function loadReport() {
    if (!merchantId) {
      toast.error('Selecione uma loja');
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams({
        startTime: period.startTime,
        endTime: period.endTime,
        env: 'production',
      });
      const res = await fetch(`/api/merchants/${merchantId}/report?${query}`);
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const reportData = await res.json();
      setData(reportData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['Métrica', 'Valor'],
      ['Faturamento Bruto', data.report.financial.grossRevenue],
      ['Faturamento Líquido', data.report.financial.netRevenue],
      ['Comissões', data.report.financial.commissions],
      ['Total Pedidos', data.report.financial.totalOrders],
      ['Ticket Médio', data.report.financial.avgTicket],
      ['Taxa de Cancelamento', data.report.operational.cancellationRate + '%'],
      ['Avaliação Média', data.report.operational.avgRating],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_ifood_${data.merchant.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios iFood</h1>
          <p className="text-sm text-gray-500">Análise financeira e operacional por loja</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            defaultValue={merchantId}
            onChange={(val) => setMerchantId(val)}
            className="w-64"
          >
            <option value="">Selecione a Loja</option>
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Button onClick={loadReport} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Financial Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Faturamento Bruto"
              value={data.report.financial.grossRevenue}
              icon={<DollarSign size={20} />}
              prefix="R$ "
            />
            <StatCard
              title="Faturamento Líquido"
              value={data.report.financial.netRevenue}
              icon={<TrendingUp size={20} />}
              prefix="R$ "
              color="text-green-600"
            />
            <StatCard
              title="Comissões iFood"
              value={data.report.financial.commissions}
              icon={<TrendingDown size={20} />}
              prefix="R$ "
              color="text-red-600"
            />
            <StatCard
              title="Ticket Médio"
              value={data.report.financial.avgTicket}
              icon={<ShoppingBag size={20} />}
              prefix="R$ "
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Desempenho Operacional</h3>
                <Button variant="secondary" size="sm" onClick={exportCSV}>
                  <FileDown size={16} className="mr-2" /> Exportar CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border">
                  <div className="p-3 bg-white rounded-full shadow-sm"><Clock size={24} className="text-blue-500" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Tempo Médio Preparo</p>
                    <p className="text-lg font-bold">{(data.report.operational.avgPrepTime / 60).toFixed(1)} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border">
                  <div className="p-3 bg-white rounded-full shadow-sm"><ShoppingBag size={24} className="text-orange-500" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Taxa de Cancelamento</p>
                    <p className="text-lg font-bold">{data.report.operational.cancellationRate.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border">
                  <div className="p-3 bg-white rounded-full shadow-sm"><Star size={24} className="text-yellow-500" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Avaliação Média</p>
                    <p className="text-lg font-bold">{data.report.operational.avgRating.toFixed(1)} / 5</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, titleColor = "text-gray-500", value, icon, prefix = "", color = "text-gray-900" }: any) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className={`text-xs font-medium ${titleColor}`}>{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-full text-gray-600">
        {icon}
      </div>
    </Card>
  );
}
