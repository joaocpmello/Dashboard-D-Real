import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700',
  success: 'bg-success-50 text-success-700 ring-success-500/20 dark:bg-success-900/30 dark:text-success-400 dark:ring-success-500/20',
  warning: 'bg-warn-50 text-warn-700 ring-warn-500/20 dark:bg-warn-900/30 dark:text-warn-400 dark:ring-warn-500/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/20 dark:bg-danger-900/30 dark:text-danger-400 dark:ring-danger-500/20',
  info: 'bg-info-50 text-info-700 ring-info-500/20 dark:bg-info-900/30 dark:text-info-400 dark:ring-info-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-500/20',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'success' }: { tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const color = {
    success: 'bg-success-500',
    warning: 'bg-warn-500',
    danger: 'bg-danger-500',
    neutral: 'bg-ink-400',
  }[tone];
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}
