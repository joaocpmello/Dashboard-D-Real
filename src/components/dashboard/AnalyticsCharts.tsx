'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

type AnalyticsData = {
  revenueOverTime: { date: string; value: number }[];
  statusDistribution: { status: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: '#22c55e', // success
  CANCELLED: '#ef4444', // danger
  PLACED: '#3b82f6',    // info
  CONFIRMED: '#f97316', // brand
  DISPATCHED: '#eab308', // warning
};

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Período</CardTitle>
          <CardDescription>Receita bruta dos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardBody className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  const date = new Date(val);
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                }}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                  'Faturamento',
                ]}
              />
              <Bar
                dataKey="value"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
          <CardDescription>Volume de pedidos por estado atual</CardDescription>
        </CardHeader>
        <CardBody className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="status"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [value, 'Pedidos']}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
