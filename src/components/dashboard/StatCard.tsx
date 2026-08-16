import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: 'brand' | 'success' | 'info' | 'neutral' | 'warning';
};

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-700',
  info: 'bg-info-50 text-info-700',
  warning: 'bg-warn-50 text-warn-700',
  neutral: 'bg-ink-100 text-ink-700',
};

export function StatCard({ label, value, hint, icon, tone = 'brand' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${toneStyles[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold text-ink-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}
