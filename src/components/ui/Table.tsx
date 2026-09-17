import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-800/60 text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-100 dark:divide-ink-800">{children}</tbody>;
}

export function TR({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-colors hover:bg-ink-50 dark:hover:bg-ink-800' : ''}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

export function TD({ children, className = '', colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 text-ink-700 dark:text-ink-300 ${className}`}>{children}</td>;
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <p className="text-sm text-ink-500 dark:text-ink-400">{message}</p>
    </div>
  );
}
