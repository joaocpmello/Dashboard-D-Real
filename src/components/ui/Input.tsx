import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        'h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 ' +
        'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
        `disabled:bg-ink-50 disabled:text-ink-500 ${className}`
      }
      {...rest}
    />
  );
}

export function Select({
  className = '',
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className={
        'h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 ' +
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
        `disabled:bg-ink-50 ${className}`
      }
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({
  htmlFor,
  children,
  className = '',
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 block text-sm font-medium text-ink-700 ${className}`}
    >
      {children}
    </label>
  );
}
