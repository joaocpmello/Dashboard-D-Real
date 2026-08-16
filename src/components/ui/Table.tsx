import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-ink-200 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-100">{children}</tbody>;
}

export function TR({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-colors hover:bg-ink-50' : ''}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-ink-700 ${className}`}>{children}</td>;
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}
