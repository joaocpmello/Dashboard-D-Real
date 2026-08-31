'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

type StatusData = {
  name: string;
  value: number;
};

type Props = {
  data: StatusData[];
  title: string;
};

const COLORS = {
  DELIVERED: '#22c55e', // success
  CANCELLED: '#ef4444', // danger
  PLACED: '#3b82f6',    // info
  CONFIRMED: '#f97316', // brand
  DISPATCHED: '#eab308', // warning
};

export function OrderStatusChart({ data, title }: Props) {
  return (
    <div className="h-[300px] w-full">
      <h4 className="mb-4 text-sm font-medium text-ink-900">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[(entry.name as keyof typeof COLORS)] || '#cbd5e1'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
