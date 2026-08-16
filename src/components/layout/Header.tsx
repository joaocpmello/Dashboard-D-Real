import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';

type Props = {
  title: string;
  subtitle?: string;
  orgName?: string | null;
  isDemo?: boolean;
  actions?: ReactNode;
};

export function Header({ title, subtitle, orgName, isDemo, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-ink-900">{title}</h1>
            {isDemo && (
              <Badge tone="warning" className="uppercase tracking-wide">
                Modo demo
              </Badge>
            )}
          </div>
          {subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {orgName && (
            <div className="hidden text-right md:block">
              <p className="text-[11px] uppercase tracking-wide text-ink-400">Organização</p>
              <p className="text-sm font-medium text-ink-800">{orgName}</p>
            </div>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
