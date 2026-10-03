import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Clock, Star, Calendar } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, prefix = '', color = 'text-slate-900' }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{prefix}{value}</p>
    </div>
    <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
      <Icon size={24} />
    </div>
  </div>
);

export default function IfoodReports() {
  const [loading, setLoading] = useState(false);
  const [financials, setFinancials] = useState(null);
  const [operational, setOperational] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [finRes, opRes] = await Promise.all([
        fetch(`/api/ifood/reports/financial?configId=default&startTime=${dateRange.start}&endTime=${dateRange.end}`),
        fetch(`/api/ifood/reports/operational?configId=default&startTime=${dateRange.start}&endTime=${dateRange.end}`)
      ]);

      setFinancials(await finRes.json());
      setOperational(await opRes.json());
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const chartData = [
    { date: '01/09', revenue: 4000 },
    { date: '05/09', revenue: 3000 },
    { date: '10/09', revenue: 5000 },
    { date: '15/09', revenue: 2780 },
    { date: '20/09', revenue: 1890 },
    { date: '25/09', revenue: 2390 },
    { date: '30/09', revenue: 3490 },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios iFood</h1>
          <p className="text-slate-500">Acompanhamento financeiro e operacional da sua loja</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <Calendar size={18} className="ml-2 text-slate-400" />
          <input
            type="date"
            className="text-sm outline-none bg-transparent p-1"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
          <span className="text-slate-400">até</span>
          <input
            type="date"
            className="text-sm outline-none bg-transparent p-1"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
          <button
            onClick={fetchReports}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Filtrar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Bruto"
          value={financials?.grossRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
          icon={DollarSign}
        />
        <StatCard
          title="Faturamento Líquido"
          value={financials?.netRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="Total de Pedidos"
          value={financials?.totalOrders || 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Ticket Médio"
          value={financials?.avgTicket?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
          icon={ShoppingBag}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Tendência de Faturamento</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0,0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Métricas Operacionais</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-500" size={20} />
                <span className="text-sm text-slate-600">Tempo Médio Preparo</span>
              </div>
              <span className="font-bold text-slate-900">
                {operational?.avgPrepTime ? `${(operational.avgPrepTime / 60).toFixed(1)} min` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Star className="text-yellow-500" size={20} />
                <span className="text-sm text-slate-600">Avaliação Média</span>
              </div>
              <span className="font-bold text-slate-900">
                {operational?.avgRating ? `${operational.avgRating.toFixed(1)} / 5` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-red-500" size={20} />
                <span className="text-sm text-slate-600">Taxa de Cancelamento</span>
              </div>
              <span className="font-bold text-slate-900">
                {operational?.cancellationRate ? `${operational.cancellationRate.toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
